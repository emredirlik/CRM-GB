import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, RotateCcw, Check, Flashlight, ZoomIn, Focus } from 'lucide-react';

const DocumentScanner = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Start camera when dialog opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check for flash capability
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities?.();
      if (capabilities?.torch) {
        setHasFlash(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Kamera erişimi reddedildi. Lütfen tarayıcı ayarlarından izin verin.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleFlash = async () => {
    if (stream && hasFlash) {
      const track = stream.getVideoTracks()[0];
      try {
        await track.applyConstraints({
          advanced: [{ torch: !flashOn }]
        });
        setFlashOn(!flashOn);
      } catch (err) {
        console.error('Flash error:', err);
      }
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame
    ctx.drawImage(video, 0, 0);

    // Apply some basic image enhancement
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Increase contrast and brightness for document scanning
    const contrast = 1.2;
    const brightness = 10;
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128 + brightness));
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128 + brightness));
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128 + brightness));
    }
    
    ctx.putImageData(imageData, 0, 0);

    // Get the image as data URL
    const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageUrl);
    stopCamera();
  }, []);

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = async () => {
    if (!capturedImage) return;
    
    setIsProcessing(true);
    
    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Call the onCapture callback with the file
      onCapture(file);
      
      // Close and reset
      setCapturedImage(null);
      onClose();
    } catch (err) {
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-black">
        <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Fatura Tarayıcı
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-8 text-center">
              <Camera className="w-16 h-16 mb-4 text-gray-500" />
              <p className="text-lg mb-2">Kamera Erişimi Gerekli</p>
              <p className="text-sm text-gray-400 mb-4">{cameraError}</p>
              <Button onClick={startCamera} variant="outline" className="text-white border-white">
                Tekrar Dene
              </Button>
            </div>
          ) : capturedImage ? (
            // Show captured image
            <div className="w-full h-full">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full h-full object-contain bg-black"
              />
              
              {/* Document detection overlay */}
              <div className="absolute inset-8 border-2 border-green-500 rounded-lg pointer-events-none">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-4">
                <Button 
                  onClick={retakePhoto}
                  variant="outline"
                  className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Tekrar Çek
                </Button>
                <Button 
                  onClick={confirmPhoto}
                  className="bg-green-600 hover:bg-green-700 text-white px-8"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Onayla
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Show camera preview
            <div className="w-full h-full relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Scanning frame overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Dark overlay outside frame */}
                <div className="absolute inset-0 bg-black/40" />
                
                {/* Clear area for document */}
                <div className="absolute inset-8 bg-transparent" style={{ 
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                  border: '2px solid rgba(255,255,255,0.5)',
                  borderRadius: '8px'
                }}>
                  {/* Corner markers */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                  
                  {/* Center focus indicator */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Focus className="w-12 h-12 text-white/50" />
                  </div>
                </div>
                
                {/* Scanning line animation */}
                <div className="absolute left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse" 
                  style={{ 
                    top: '50%',
                    animation: 'scanLine 2s ease-in-out infinite'
                  }} 
                />
              </div>
              
              {/* Instructions */}
              <div className="absolute top-20 left-0 right-0 text-center">
                <p className="text-white text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
                  Faturayı çerçeveye yerleştirin
                </p>
              </div>
              
              {/* Camera controls */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between">
                  {/* Left controls */}
                  <div className="flex gap-2">
                    {hasFlash && (
                      <Button
                        onClick={toggleFlash}
                        variant="ghost"
                        size="icon"
                        className={`rounded-full ${flashOn ? 'bg-yellow-500 text-black' : 'bg-white/20 text-white'}`}
                      >
                        <Flashlight className="w-5 h-5" />
                      </Button>
                    )}
                    <Button
                      onClick={switchCamera}
                      variant="ghost"
                      size="icon"
                      className="rounded-full bg-white/20 text-white"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {/* Capture button */}
                  <Button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white hover:bg-gray-200 p-0"
                  >
                    <div className="w-14 h-14 rounded-full border-4 border-gray-800" />
                  </Button>
                  
                  {/* Right spacer */}
                  <div className="w-20" />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
        
        {/* CSS for scan line animation */}
        <style>{`
          @keyframes scanLine {
            0%, 100% { top: 15%; opacity: 0; }
            50% { top: 85%; opacity: 1; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentScanner;
