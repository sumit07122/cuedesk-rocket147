import React, { useState, useEffect } from 'react';
import { generateQRCodeDataUrl, downloadDataUrl } from '../../utils/qrCodeGenerator';
import { Loader2 } from 'lucide-react';

interface QRCodeComponentProps {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
  onDataUrlReady?: (dataUrl: string) => void;
}

export const QRCodeComponent: React.FC<QRCodeComponentProps> = ({
  value,
  size = 240,
  className = '',
  alt = 'QR Code',
  onDataUrlReady,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    generateQRCodeDataUrl(value, { width: size * 2, margin: 2 })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setLoading(false);
          if (onDataUrlReady) onDataUrlReady(url);
        }
      })
      .catch((err) => {
        console.error('QR Generation error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, onDataUrlReady]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 rounded-xl ${className}`}
        style={{ width: size, height: size }}
      >
        <Loader2 className="w-6 h-6 text-neutral-400 animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      className={`object-contain rounded-xl ${className}`}
      style={{ width: size, height: size }}
    />
  );
};
