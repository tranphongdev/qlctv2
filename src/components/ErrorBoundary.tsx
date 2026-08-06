import React from 'react';
import { ErrorScreen } from './ErrorScreen';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Chặn lỗi render của cả cây con và thay bằng màn hình báo lỗi.
 *
 * Phải là class component: React chưa có API hook nào tương đương cho
 * componentDidCatch. Không có ranh giới này thì một lỗi bất kỳ trong lúc render
 * sẽ gỡ trắng toàn bộ cây và người dùng chỉ thấy trang trắng không manh mối.
 *
 * Lưu ý phạm vi: chỉ bắt lỗi phát sinh trong lúc render, trong lifecycle và
 * trong constructor của cây con. Lỗi ném ra từ trình xử lý sự kiện, từ setTimeout
 * hay từ promise bị reject đều KHÔNG đi qua đây — những chỗ đó vẫn phải tự bắt.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Lỗi render:', error, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return <ErrorScreen error={this.state.error} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
