
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface CameraScannerProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false); // Default to false for environment camera
  const [errorState, setErrorState] = useState<{message: string, type: 'permission' | 'other'} | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const setupCamera = useCallback(async () => {
    if (isStarting) return;
    setIsStarting(true);
    setErrorState(null);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
      }

      // Stop any existing tracks first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Start with preferred constraints
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      });
      
      streamRef.current = s;
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        const track = s.getVideoTracks()[0];
        const settings = track.getSettings();
        setIsMirrored(settings.facingMode === 'user');
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorState({
          message: "Camera access denied. Please enable camera permissions in your browser settings to use FreshTrack.",
          type: 'permission'
        });
      } else {
        setErrorState({
          message: "Unable to access camera. Please check if another app is using it or try refreshing the page.",
          type: 'other'
        });
      }
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, stream]);

  useEffect(() => {
    setupCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    
    try {
      const capabilities = (track as any).getCapabilities?.() || {};
      if (!capabilities.torch) {
        console.warn("Flashlight is not supported on this device.");
        return;
      }
      const nextState = !isFlashOn;
      await track.applyConstraints({
        advanced: [{ torch: nextState }]
      } as any);
      setIsFlashOn(nextState);
    } catch (e) {
      console.error("Flash toggle failed:", e);
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        const width = videoRef.current.videoWidth;
        const height = videoRef.current.videoHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        
        if (isMirrored) {
          context.translate(width, 0);
          context.scale(-1, 1);
        }
        
        context.drawImage(videoRef.current, 0, 0, width, height);
        context.setTransform(1, 0, 0, 1, 0, 0);
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
        const base64 = dataUrl.split(',')[1];
        stopTracks();
        onCapture(base64);
      }
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        stopTracks();
        onCapture(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  if (errorState) {
    return (
      <div className="fixed inset-0 bg-background-dark z-[100] flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
        <div className="size-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
          <span className="material-symbols-outlined text-red-500 text-5xl">no_photography</span>
        </div>
        <h3 className="text-white text-2xl font-black mb-4 tracking-tight">Camera Unavailable</h3>
        <p className="text-gray-400 text-sm mb-12 max-w-xs leading-relaxed">
          {errorState.message}
        </p>
        <div className="flex flex-col w-full gap-4 max-w-[280px]">
          <button 
            onClick={setupCamera}
            className="w-full h-14 bg-primary text-white font-black rounded-2xl active:scale-95 transition-all shadow-fab-glow flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">refresh</span>
            TRY AGAIN
          </button>
          <button 
            onClick={onClose}
            className="w-full h-14 bg-white/5 text-white/60 font-black rounded-2xl active:scale-95 transition-all"
          >
            GO BACK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-between overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      {/* Video Feed */}
      <div className="absolute inset-0 bg-black">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${isMirrored ? 'scale-x-[-1]' : 'scale-x-1'} ${stream ? 'opacity-100' : 'opacity-0'}`}
        />
        {!stream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Waking Sensor...</span>
            </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />

      {/* UI Overlays */}
      <div className="absolute inset-0 flex flex-col items-center justify-between z-10 p-6 pt-12 safe-top">
        {/* Top Bar */}
        <div className="w-full flex items-center justify-between">
          <button 
            onClick={onClose}
            className="size-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl text-white active:scale-90 transition-all border border-white/10"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
            <span className="material-symbols-outlined text-primary text-[18px] animate-pulse">nutrition</span>
            <span className="text-white text-[10px] font-black tracking-[0.2em] uppercase">Ready to Scan</span>
          </div>

          <button 
            onClick={() => setIsMirrored(!isMirrored)}
            className="size-11 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-xl text-white active:scale-90 transition-all border border-white/10"
          >
            <span className="material-symbols-outlined text-[20px]">flip_camera_ios</span>
          </button>
        </div>

        {/* Focus Frame */}
        <div className="relative w-72 h-72 md:w-80 md:h-80 group">
          <div className="absolute inset-0 border-[1px] border-white/20 rounded-[3rem] group-hover:border-white/40 transition-colors"></div>
          
          {/* Corners */}
          <div className="absolute -top-1 -left-1 w-12 h-12 border-t-[5px] border-l-[5px] border-primary rounded-tl-[2rem]"></div>
          <div className="absolute -top-1 -right-1 w-12 h-12 border-t-[5px] border-r-[5px] border-primary rounded-tr-[2rem]"></div>
          <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-[5px] border-l-[5px] border-primary rounded-bl-[2rem]"></div>
          <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-[5px] border-r-[5px] border-primary rounded-br-[2rem]"></div>
          
          {/* Scanning Effect */}
          <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2.5s_ease-in-out_infinite] shadow-[0_0_20px_rgba(154,190,137,0.8)]"></div>
          
          <div className="absolute -bottom-12 left-0 right-0 text-center">
            <span className="text-white/60 text-[9px] font-black uppercase tracking-[0.3em] drop-shadow-lg">Alignment Grid Active</span>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="w-full pb-12 flex flex-col items-center safe-bottom">
          <div className="w-full max-w-sm px-10 flex items-center justify-between">
            {/* Gallery */}
            <button 
              onClick={handleGalleryClick}
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div className="size-14 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white group-active:scale-90 group-hover:border-primary/50">
                <span className="material-symbols-outlined text-[28px]">photo_library</span>
              </div>
              <span className="text-white text-[9px] font-black uppercase tracking-widest opacity-40">Library</span>
            </button>

            {/* Shutter */}
            <div className="relative p-2.5 border-[5px] border-white/20 rounded-full group transition-all hover:border-white/40">
              <button 
                onClick={takePhoto}
                disabled={!stream}
                className="size-20 bg-primary rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(154,190,137,0.5)] active:scale-90 transition-all disabled:opacity-50 disabled:grayscale"
              >
                <span className="material-symbols-outlined text-[48px] text-white">camera</span>
              </button>
              {/* Outer Glow Ring */}
              <div className="absolute inset-[-10px] rounded-full border-2 border-primary/20 animate-pulse pointer-events-none"></div>
            </div>

            {/* Flash */}
            <button 
              onClick={toggleFlash}
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div className={`size-14 flex items-center justify-center rounded-2xl backdrop-blur-xl border transition-all group-active:scale-90 ${isFlashOn ? 'bg-primary border-primary text-white shadow-fab-glow' : 'bg-black/40 border-white/10 text-white'}`}>
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: isFlashOn ? "'FILL' 1" : "'FILL' 0" }}>
                  {isFlashOn ? 'flash_on' : 'bolt'}
                </span>
              </div>
              <span className="text-white text-[9px] font-black uppercase tracking-widest opacity-40">Torch</span>
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
