import { useEffect, useRef, useId, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Flashlight, FlashlightOff, ZoomIn } from 'lucide-react';
import { ZoomSlider } from '../ui/ZoomSlider';
import { validateEAN13 } from '../../lib/ean13';

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // AudioContext not available
  }
}

interface Props {
  onScan: (ean: string) => void;
  onError?: (msg: string) => void;
}

export function BarcodeScanner({ onScan, onError }: Props) {
  const uid = useId().replace(/:/g, '');
  const scannerId = `qr-reader-${uid}`;
  const startedRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const lastScanRef = useRef<{ ean: string; ts: number } | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 4 });
  const [currentZoom, setCurrentZoom] = useState(2);
  const [torchOn, setTorchOn] = useState(false);

  const getZoomFeature = () => {
    const caps = scannerRef.current?.getRunningTrackCameraCapabilities();
    return (caps as unknown as { zoomFeature?: () => { isSupported: () => boolean; min: () => number; max: () => number; apply: (v: number) => void } })?.zoomFeature?.();
  };

  const getTorchFeature = () => {
    const caps = scannerRef.current?.getRunningTrackCameraCapabilities();
    return (caps as unknown as { torchFeature?: () => { apply: (v: boolean) => Promise<void> } })?.torchFeature?.();
  };

  const handleZoomChange = useCallback((val: number) => {
    setCurrentZoom(val);
    try { getZoomFeature()?.apply(val); } catch { /* not supported */ }
  }, []);

  const toggleTorch = useCallback(async () => {
    try {
      await getTorchFeature()?.apply(!torchOn);
      setTorchOn(v => !v);
    } catch { /* not supported */ }
  }, [torchOn]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const scanner = new Html5Qrcode(scannerId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
      verbose: false,
    });
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: (w, h) => ({ width: Math.floor(w * 0.8), height: Math.floor(h * 0.25) }),
      },
      (decodedText) => {
        if (!validateEAN13(decodedText)) {
          onError?.('Invalid barcode — please try again.');
          return;
        }
        const now = Date.now();
        const last = lastScanRef.current;
        if (last && last.ean === decodedText && now - last.ts < 2000) return;
        lastScanRef.current = { ean: decodedText, ts: now };
        playBeep();
        try { navigator.vibrate(80); } catch { /* not supported */ }
        onScan(decodedText);
      },
      () => { /* per-frame failure is normal */ },
    ).then(() => {
      isRunningRef.current = true;
      setTimeout(() => {
        const zoom = getZoomFeature();
        if (zoom?.isSupported()) {
          setZoomSupported(true);
          setZoomRange({ min: Math.max(1, zoom.min()), max: Math.min(8, zoom.max()) });
          zoom.apply(2.0);
        }
      }, 500);
    }).catch((err: Error) => {
      const msg = err.message ?? '';
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setCameraError('permission');
      } else if (msg.includes('NotFound') || msg.includes('no camera')) {
        setCameraError('no_camera');
      } else {
        setCameraError('unavailable');
      }
    });

    return () => {
      if (!isRunningRef.current) return;
      isRunningRef.current = false;
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cameraError === 'permission') {
    return (
      <div className="flex-1 bg-navy flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-white text-lg font-semibold">Camera Access Required</p>
        <p className="text-mid-grey text-sm">Please enable camera access in your device settings to scan barcodes.</p>
        <p className="text-mid-grey text-xs mt-2">iOS: Settings → Safari → Camera | Android: Settings → Apps → Browser → Permissions</p>
      </div>
    );
  }

  if (cameraError === 'no_camera' || cameraError === 'unavailable') {
    return (
      <div className="flex-1 bg-navy flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-white text-lg font-semibold">No Camera Detected</p>
        <p className="text-mid-grey text-sm">This app requires a device with a rear camera.</p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 bg-black overflow-hidden">
      {/* html5-qrcode target — Tailwind suppresses duplicate video/img chrome */}
      <div
        id={scannerId}
        className="w-full h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_img]:!hidden [&_canvas]:!hidden"
      />

      {/* Targeting overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="border-2 border-white/80 rounded-lg" style={{ width: '80%', height: '80px' }}>
          <div className="w-full h-0.5 bg-primark-blue/80 animate-pulse mt-9" />
        </div>
        <p className="absolute bottom-20 text-white text-xs opacity-70">Align EAN-13 barcode within the frame</p>
      </div>

      {/* Torch toggle */}
      <button
        onClick={toggleTorch}
        className="absolute top-3 left-3 p-2.5 bg-black/50 rounded-xl text-white backdrop-blur-sm z-10"
        aria-label={torchOn ? 'Turn off torch' : 'Turn on torch'}
      >
        {torchOn ? <FlashlightOff size={20} /> : <Flashlight size={20} />}
      </button>

      {/* Zoom controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-2 pt-1 z-10">
        {zoomSupported ? (
          <ZoomSlider min={zoomRange.min} max={zoomRange.max} value={currentZoom} onChange={handleZoomChange} />
        ) : (
          <div className="flex items-center justify-center gap-1.5 py-1">
            <ZoomIn size={14} className="text-white/50" />
            <p className="text-white/50 text-xs">Move closer to scan</p>
          </div>
        )}
      </div>
    </div>
  );
}
