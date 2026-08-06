import React, { useCallback, useState } from 'react';
import { Modal, Slider, Button } from 'antd';
import { message } from '../lib/antdApp';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { ZoomIn } from 'lucide-react';
import { t } from '../i18n';

/** Cạnh ảnh đầu ra. Avatar hiển thị tối đa 64px nên 256px là đủ nét cho màn Retina. */
const OUTPUT_SIZE = 256;

interface AvatarCropModalProps {
  /** Ảnh nguồn dạng data URI; null nghĩa là đóng modal. */
  src: string | null;
  onCancel: () => void;
  onCropped: (dataUrl: string) => void;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.src = src;
  });
}

/** Vẽ vùng đã chọn ra canvas vuông rồi xuất JPEG để giảm dung lượng lưu trữ. */
async function cropToDataUrl(src: string, area: Area): Promise<string> {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context không khả dụng');

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  return canvas.toDataURL('image/jpeg', 0.9);
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({ src, onCancel, onCropped }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!src || !croppedArea) return;
    setSaving(true);
    try {
      onCropped(await cropToDataUrl(src, croppedArea));
    } catch {
      message.error(t('avatar.crop_failed'));
    } finally {
      setSaving(false);
    }
  };

  // Mỗi lần mở ảnh mới phải reset khung cắt, nếu không sẽ giữ vị trí của ảnh trước.
  const handleAfterClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedArea(null);
  };

  return (
    <Modal
      open={!!src}
      onCancel={onCancel}
      afterClose={handleAfterClose}
      title={t('avatar.crop_title')}
      footer={null}
      width={420}
      destroyOnHidden
    >
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 280,
            background: '#0f172a',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          )}
        </div>

        <div style={{ fontSize: 12, color: '#94a3b8', margin: '12px 0 4px' }}>{t('avatar.crop_hint')}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ZoomIn size={16} />
          <Slider
            style={{ flex: 1 }}
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={setZoom}
            tooltip={{ formatter: (v) => `${v}x` }}
            aria-label={t('avatar.zoom')}
          />
        </div>

        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            {t('common.cancel')}
          </Button>
          <Button type="primary" loading={saving} disabled={!croppedArea} onClick={handleConfirm}>
            {t('avatar.crop_confirm')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
