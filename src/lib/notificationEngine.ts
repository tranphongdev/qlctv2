import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { DEBT_DIRECTION, DEBT_STATUS, TX_TYPE } from '~/types';
import type { AppState, Category, NotificationItem, NotificationSeverity } from '~/types';
import { formatMoney, formatDate } from '~/utils/format';
import { resolveCategory } from '~/utils/categories';
import { t } from '~/i18n';

/**
 * Bộ luật sinh thông báo.
 *
 * Thông báo ở app này là thứ *dẫn xuất* từ dữ liệu chứ không phải bản ghi người
 * dùng tạo ra: không có màn hình nào để "viết một thông báo". Toàn bộ module là
 * một hàm thuần — đưa vào trạng thái, trả ra danh sách thông báo *đáng lẽ phải
 * tồn tại* tại thời điểm này. Việc lọc cái nào đã có, lưu xuống đâu là chuyện của
 * appStore.
 *
 * Vì hàm thuần nên chạy lại bao nhiêu lần cũng không sao, và đó chính là cách
 * chống trùng: mỗi luật gắn cho thông báo một id tất định (xem NotificationItem.id).
 *
 * Chuỗi tiêu đề / nội dung được dịch NGAY lúc sinh rồi lưu xuống, giống cách gieo
 * tên danh mục mặc định trong appStore. Thông báo là ảnh chụp một khoảnh khắc —
 * "đã chi 4.500.000₫ trên hạn mức 4.000.000₫" chỉ đúng với số liệu tại lúc đó —
 * nên dịch lại lúc hiển thị cũng không làm nó chính xác hơn, mà lại phải lưu thêm
 * toàn bộ tham số của từng luật.
 */

/** Ngưỡng cảnh báo ngân sách, xếp giảm dần để `find` trả về mốc cao nhất đã chạm. */
const BUDGET_THRESHOLDS = [120, 100, 80, 50];

/** Các mốc nhắc trước hạn nợ (số ngày), xếp tăng dần để lấy mốc sát nhất. */
const DEBT_DUE_BUCKETS = [1, 3, 7];

/** Mốc tiến độ mục tiêu, xếp giảm dần. */
const GOAL_MILESTONES = [100, 75, 50, 25];

/** Trong bao nhiêu ngày cuối trước hạn thì một mục tiêu chậm tiến độ bị nhắc. */
const GOAL_DEADLINE_WINDOW_DAYS = 30;

/** Dưới mức này khi hạn đã cận kề thì coi là chậm tiến độ. */
const GOAL_BEHIND_PCT = 80;

/**
 * Trang mà mỗi loại thông báo dẫn tới khi người dùng bấm vào.
 *
 * Suy từ `type` thay vì lưu kèm mỗi bản ghi: đường dẫn là chuyện của giao diện và
 * có thể đổi bất cứ lúc nào, còn thông báo thì nằm lại trong localStorage hàng
 * tháng trời. Lưu đường dẫn xuống là tự tạo ra những liên kết chết.
 */
export const NOTIFICATION_TAB: Record<NotificationItem['type'], string> = {
  budget: 'budgets',
  debt: 'debts',
  goal: 'goals',
  income: 'transactions',
  system: 'dashboard',
};

type Draft = Omit<NotificationItem, 'date' | 'read'>;

function toItem(draft: Draft, now: Dayjs): NotificationItem {
  return { ...draft, date: now.toISOString(), read: false };
}

function severityOfBudget(mark: number): NotificationSeverity {
  if (mark >= 100) return 'critical';
  if (mark >= 80) return 'warning';
  return 'info';
}

/**
 * Ngân sách: chạm 50 / 80 / 100 / 120% hạn mức tháng.
 *
 * Chỉ sinh MỘT thông báo cho mốc cao nhất đã chạm, không phải mọi mốc đã vượt qua.
 * Người vừa nhập một khoản chi lớn đẩy ngân sách từ 0% lên 85% mà nhận cùng lúc
 * hai thông báo "đã dùng 50%" và "đã dùng 80%" thì cái đầu chỉ là nhiễu. Các mốc
 * thấp hơn vẫn có id riêng nên vẫn bắn bình thường nếu người dùng đi qua từng nấc.
 */
function budgetRules(state: AppState, now: Dayjs): NotificationItem[] {
  const monthKey = now.format('YYYY-MM');
  const categoriesMap = state.categories.reduce(
    (acc, c) => ({ ...acc, [c.id]: c }),
    {} as Record<string, Category>,
  );

  const out: NotificationItem[] = [];

  for (const budget of state.budgets) {
    // Ngân sách của tháng khác đã chốt sổ, nhắc nữa cũng không sửa được gì.
    if (budget.monthKey !== monthKey || budget.amount <= 0) continue;

    const spent = state.transactions
      .filter(
        (tx) =>
          tx.type === TX_TYPE.EXPENSE &&
          tx.category === budget.category &&
          tx.date.startsWith(monthKey),
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    const pct = Math.round((spent / budget.amount) * 100);
    const mark = BUDGET_THRESHOLDS.find((m) => pct >= m);
    if (mark === undefined) continue;

    const category = resolveCategory(budget.category, categoriesMap).name;
    const over = mark >= 100;

    out.push(
      toItem(
        {
          id: `budget:${budget.id}:${monthKey}:${mark}`,
          type: 'budget',
          severity: severityOfBudget(mark),
          title: over
            ? t('notif.budget.over_title', { category })
            : t('notif.budget.warn_title', { category, pct: mark }),
          message: over
            ? t('notif.budget.over_msg', {
                pct,
                spent: formatMoney(spent),
                limit: formatMoney(budget.amount),
                over: formatMoney(spent - budget.amount),
              })
            : t('notif.budget.warn_msg', {
                spent: formatMoney(spent),
                limit: formatMoney(budget.amount),
                left: formatMoney(budget.amount - spent),
              }),
        },
        now,
      ),
    );
  }

  return out;
}

/**
 * Nợ: nhắc trước hạn 7 / 3 / 1 ngày, và báo khi đã quá hạn.
 *
 * Cũng chỉ lấy MỘT mốc — mốc sát hạn nhất — vì cùng lý do với ngân sách. Người mở
 * app vào ngày còn 5 hôm nhận mốc 7; tới ngày còn 2 hôm nhận mốc 3; đúng hôm hạn
 * nhận mốc 1. Ba lời nhắc rải đều thay vì ba lời nhắc cùng lúc.
 */
function debtRules(state: AppState, now: Dayjs): NotificationItem[] {
  const today = now.startOf('day');
  const out: NotificationItem[] = [];

  for (const debt of state.debts) {
    if (debt.status !== DEBT_STATUS.ACTIVE || !debt.due) continue;

    // Đã trả đủ nhưng chưa kịp đổi trạng thái thì cũng không còn gì để nhắc.
    const remaining = debt.amount - debt.paid;
    if (remaining <= 0) continue;

    const daysLeft = dayjs(debt.due).startOf('day').diff(today, 'day');
    const lending = debt.direction === DEBT_DIRECTION.LENDING;
    const amount = formatMoney(remaining);
    const due = formatDate(debt.due);

    if (daysLeft < 0) {
      out.push(
        toItem(
          {
            id: `debt:${debt.id}:overdue`,
            type: 'debt',
            severity: 'critical',
            title: lending
              ? t('notif.debt.overdue_lend_title', { name: debt.name })
              : t('notif.debt.overdue_borrow_title', { name: debt.name }),
            message: t('notif.debt.overdue_msg', { days: -daysLeft, due, amount }),
          },
          now,
        ),
      );
      continue;
    }

    const bucket = DEBT_DUE_BUCKETS.find((b) => daysLeft <= b);
    if (bucket === undefined) continue;

    out.push(
      toItem(
        {
          id: `debt:${debt.id}:due-${bucket}`,
          type: 'debt',
          severity: bucket === 1 ? 'critical' : bucket === 3 ? 'warning' : 'info',
          title: lending
            ? t('notif.debt.due_lend_title', { name: debt.name })
            : t('notif.debt.due_borrow_title', { name: debt.name }),
          message:
            daysLeft === 0
              ? t('notif.debt.due_today_msg', { due, amount })
              : t('notif.debt.due_msg', { days: daysLeft, due, amount }),
        },
        now,
      ),
    );
  }

  return out;
}

/**
 * Mục tiêu: mốc tiến độ 25 / 50 / 75 / 100%, kèm nhắc khi hạn cận kề mà còn chậm.
 *
 * Mốc tiến độ là thông báo *vui*, khác hẳn hai bộ luật trên — nên severity luôn là
 * 'info' kể cả ở mốc 100%.
 */
function goalRules(state: AppState, now: Dayjs): NotificationItem[] {
  const today = now.startOf('day');
  const out: NotificationItem[] = [];

  for (const goal of state.goals) {
    if (goal.target <= 0) continue;

    const pct = Math.round((goal.saved / goal.target) * 100);
    const left = formatMoney(Math.max(0, goal.target - goal.saved));
    const mark = GOAL_MILESTONES.find((m) => pct >= m);

    if (mark !== undefined) {
      const done = mark >= 100;
      out.push(
        toItem(
          {
            id: `goal:${goal.id}:milestone-${mark}`,
            type: 'goal',
            severity: 'info',
            title: done
              ? t('notif.goal.done_title', { name: goal.name })
              : t('notif.goal.milestone_title', { name: goal.name, pct: mark }),
            message: done
              ? t('notif.goal.done_msg', { target: formatMoney(goal.target) })
              : t('notif.goal.milestone_msg', {
                  saved: formatMoney(goal.saved),
                  target: formatMoney(goal.target),
                  left,
                }),
          },
          now,
        ),
      );
    }

    // Đã đủ tiền thì hạn chót không còn nghĩa lý gì.
    if (!goal.deadline || pct >= 100) continue;

    const daysLeft = dayjs(goal.deadline).startOf('day').diff(today, 'day');
    const deadline = formatDate(goal.deadline);

    if (daysLeft < 0) {
      out.push(
        toItem(
          {
            id: `goal:${goal.id}:overdue`,
            type: 'goal',
            severity: 'warning',
            title: t('notif.goal.overdue_title', { name: goal.name }),
            message: t('notif.goal.overdue_msg', { deadline, pct, left }),
          },
          now,
        ),
      );
    } else if (daysLeft <= GOAL_DEADLINE_WINDOW_DAYS && pct < GOAL_BEHIND_PCT) {
      out.push(
        toItem(
          {
            id: `goal:${goal.id}:deadline-soon`,
            type: 'goal',
            severity: 'warning',
            title: t('notif.goal.deadline_title', { name: goal.name }),
            message: t('notif.goal.deadline_msg', { days: daysLeft, deadline, pct, left }),
          },
          now,
        ),
      );
    }
  }

  return out;
}

/**
 * Chạy toàn bộ bộ luật và trả về mọi thông báo đang đúng tại thời điểm `now`.
 *
 * Kết quả CÓ CHỨA những thông báo đã sinh từ trước — người gọi phải tự lọc theo id.
 * Đó là chủ ý: hàm này không được biết gì về trạng thái đã lưu, có thế mới kiểm thử
 * được bằng cách đưa vào một AppState dựng sẵn.
 */
export function evaluateNotifications(state: AppState, now: Dayjs = dayjs()): NotificationItem[] {
  return [...budgetRules(state, now), ...debtRules(state, now), ...goalRules(state, now)];
}
