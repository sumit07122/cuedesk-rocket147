import QRCode from 'qrcode';

/**
 * Generates a high-quality QR code PNG Data URL locally without external API dependencies.
 */
export async function generateQRCodeDataUrl(
  text: string,
  options: { width?: number; margin?: number; color?: { dark?: string; light?: string } } = {}
): Promise<string> {
  const defaultOptions = {
    width: options.width || 300,
    margin: options.margin !== undefined ? options.margin : 2,
    color: {
      dark: options.color?.dark || '#09090b',
      light: options.color?.light || '#ffffff',
    },
    errorCorrectionLevel: 'H' as const,
  };

  try {
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (err) {
    console.error('Failed to generate local QR Code DataURL:', err);
    // Fallback simple inline SVG representation if QRCode fails
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${options.width || 300}" height="${options.width || 300}"><rect width="100%" height="100%" fill="#ffffff"/><text x="50%" y="50%" font-size="14" text-anchor="middle" fill="#000">QR Code Error</text></svg>`;
  }
}

/**
 * Helper to download a data URL as a file in the browser.
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
