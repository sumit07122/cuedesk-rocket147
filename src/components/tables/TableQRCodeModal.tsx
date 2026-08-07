import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  Download, 
  RefreshCw, 
  Printer, 
  CircleDot,
  Check,
  Loader2
} from 'lucide-react';
import QRCode from 'qrcode';
import { TableItem, BusinessConfig } from '../../types';
import { Button } from '../ui/Button';

interface TableQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableItem | null;
  config: BusinessConfig;
}

export const TableQRCodeModal: React.FC<TableQRCodeModalProps> = ({
  isOpen,
  onClose,
  table,
  config,
}) => {
  const [tokenKey, setTokenKey] = useState<number>(Date.now());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loadingQr, setLoadingQr] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Construct target URL for table customer session checkin
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const qrTargetUrl = table ? `${currentOrigin}/?tableId=${table.id}&key=${tokenKey}` : '';

  useEffect(() => {
    if (!isOpen || !table || !qrTargetUrl) return;
    let isMounted = true;
    setLoadingQr(true);

    const renderQrCanvas = async () => {
      try {
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, qrTargetUrl, {
            width: 320,
            margin: 2,
            color: {
              dark: '#09090b',
              light: '#ffffff',
            },
            errorCorrectionLevel: 'H',
          });
          if (isMounted && canvasRef.current) {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            setQrDataUrl(dataUrl);
            setLoadingQr(false);
          }
        }
      } catch (err) {
        console.error('Error generating canvas QR:', err);
        if (isMounted) setLoadingQr(false);
      }
    };

    renderQrCanvas();

    return () => {
      isMounted = false;
    };
  }, [isOpen, table?.id, tokenKey, qrTargetUrl]);

  if (!isOpen || !table) return null;

  const handleRegenerate = () => {
    setTokenKey(Date.now());
  };

  const handleDownloadPNG = async () => {
    if (!canvasRef.current && !qrDataUrl) return;
    setIsDownloading(true);
    try {
      const clubPrefix = config.clubName ? config.clubName.replace(/[^a-zA-Z0-0_-]/g, '_') : 'CueDesk';
      const tableNum = table.number.toString().padStart(2, '0');
      const filename = `CueDesk-Table-${tableNum}-QR.png`;

      if (canvasRef.current && canvasRef.current.toBlob) {
        canvasRef.current.toBlob((blob) => {
          if (!blob) {
            setIsDownloading(false);
            return;
          }
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);

          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 3000);
          setIsDownloading(false);
        }, 'image/png');
      } else {
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
        setIsDownloading(false);
      }
    } catch (err) {
      console.error('Error downloading QR PNG from HTMLCanvasElement:', err);
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Card - Table #${table.number} - ${config.clubName}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f8f9fa;
            }
            .qr-card {
              width: 340px;
              padding: 32px;
              background: #ffffff;
              border: 2px solid #18181b;
              border-radius: 24px;
              text-align: center;
              box-shadow: 0 10px 25px rgba(0,0,0,0.08);
            }
            .header-badge {
              display: inline-block;
              background: #18181b;
              color: #ffffff;
              padding: 6px 16px;
              border-radius: 99px;
              font-size: 14px;
              font-weight: 800;
              letter-spacing: 0.05em;
              margin-bottom: 12px;
            }
            h1 { font-size: 20px; margin: 4px 0; color: #09090b; }
            p { font-size: 12px; color: #71717a; margin: 0 0 16px 0; }
            .qr-img {
              width: 220px;
              height: 220px;
              margin: 12px auto;
              border-radius: 16px;
              border: 1px solid #e4e4e7;
              padding: 8px;
            }
            .footer-tag {
              font-size: 11px;
              font-weight: 700;
              color: #27272a;
              margin-top: 12px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <div class="header-badge">TABLE #${table.number.toString().padStart(2, '0')}</div>
            <h1>${config.clubName}</h1>
            <p>${config.tagline || 'Scan to Check-In & Order Snacks'}</p>
            <img class="qr-img" src="${qrDataUrl}" alt="Table QR" />
            <div class="footer-tag">Scan QR code to Start Session</div>
          </div>
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-neutral-200/90 flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-2xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">Table #{table.number} Permanent QR</h3>
              <p className="text-xs text-neutral-500">Official customer check-in & ordering code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content / QR Preview Card */}
        <div className="p-6 flex flex-col items-center text-center gap-4 bg-neutral-50/50">
          
          {/* Printable QR Card Container */}
          <div className="bg-white rounded-3xl border-2 border-neutral-900 p-6 shadow-md w-full max-w-xs flex flex-col items-center">
            
            <div className="bg-neutral-900 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-3 flex items-center gap-1.5 shadow-2xs">
              <CircleDot className="w-3.5 h-3.5 text-emerald-400" />
              Table #{table.number.toString().padStart(2, '0')} • {table.type.toUpperCase()}
            </div>

            <h4 className="text-base font-extrabold text-neutral-900 leading-tight">
              {config.clubName}
            </h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {config.tagline || 'Scan to Check-in & Order'}
            </p>

            {/* Hidden Canvas Element for QRCode generation */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Generated QR Image */}
            <div className="my-4 p-2 bg-white rounded-2xl border border-neutral-200 shadow-inner relative group min-h-[200px] flex items-center justify-center">
              {loadingQr ? (
                <div className="w-48 h-48 flex items-center justify-center bg-neutral-50 rounded-xl">
                  <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for Table ${table.number}`}
                  className="w-48 h-48 rounded-xl object-contain"
                />
              )}
            </div>

            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">
              Scan with Smartphone Camera
            </p>
          </div>

          <p className="text-[11px] text-neutral-400 max-w-xs">
            Customers scanning this QR code will be routed directly to Table #{table.number} session check-in page.
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 w-full pt-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-center text-xs"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={handleRegenerate}
            >
              Regenerate
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="justify-center text-xs"
              leftIcon={downloadSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
              onClick={handleDownloadPNG}
              disabled={isDownloading}
            >
              {downloadSuccess ? 'Downloaded!' : 'PNG'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              className="justify-center text-xs"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrint}
            >
              Print Card
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
