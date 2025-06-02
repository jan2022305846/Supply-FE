import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { XMarkIcon, CameraIcon, ExclamationCircleIcon, ArrowPathIcon, InformationCircleIcon, PhotoIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const QRCodeScanner = ({ onScanSuccess, onClose }) => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [permissionState, setPermissionState] = useState('initial'); // 'initial', 'requesting', 'granted', 'denied'
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);
  const [useDirectInput, setUseDirectInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [isUnsupportedDevice, setIsUnsupportedDevice] = useState(false);
  const [showDirectCaptureOption, setShowDirectCaptureOption] = useState(false);
  const [cameraDetectionAttempted, setCameraDetectionAttempted] = useState(false);
  
  const qrScannerRef = useRef(null);
  const scannerInstanceRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraCaptureRef = useRef(null);

  // Detect if we're on a mobile device
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    setIsMobileBrowser(isMobile);
    
    // For mobile devices, check if we can use the capture attribute (works on most mobile browsers)
    if (isMobile) {
      setShowDirectCaptureOption(true);
    }
    
    // Check if we're specifically on a Xiaomi device (like Redmi)
    const isXiaomi = /xiaomi|redmi|poco/i.test(userAgent.toLowerCase());
    if (isXiaomi) {
      console.log("Xiaomi device detected");
      // Don't immediately set as unsupported, but make direct capture more prominent
      setShowDirectCaptureOption(true);
    }

    // Check if camera API is available at a basic level
    const hasCameraAPI = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (!hasCameraAPI) {
      console.log("Camera API not available, using alternative methods");
      setIsUnsupportedDevice(true);
      setUseDirectInput(true);
      setShowDirectCaptureOption(true);
    } else if (isMobile) {
      // On mobile with camera API, auto-attempt camera access after a short delay
      const timer = setTimeout(() => {
        if (!cameraDetectionAttempted) {
          checkCameraPermission();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [cameraDetectionAttempted]);

  // Check camera permissions
  const checkCameraPermission = async () => {
    setCameraDetectionAttempted(true);
    
    try {
      setPermissionState('requesting');
      setError(null);
      
      // Check if API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("MediaDevices API not available");
        setUseDirectInput(true);
        throw new Error('Camera API not available on this browser or device');
      }
      
      // For mobile Chrome, need to handle permission differently
      const constraints = { 
        video: { 
          facingMode: 'environment', // Prefer rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      };
      
      // This will trigger the permission dialog
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // If we get here, permission was granted
      stream.getTracks().forEach(track => track.stop()); // Release camera immediately
      setPermissionState('granted');
      setIsUnsupportedDevice(false); // Camera works, so device is supported
      
      // Now that we have permission, get available cameras
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setCameras(devices);
          // On mobile, prefer back camera if available
          if (isMobileBrowser && devices.length > 1) {
            const backCamera = devices.find(camera => 
              /back|rear|environment|back camera/i.test(camera.label)
            );
            setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
          } else {
            setSelectedCamera(devices[0].id);
          }
          
          // Automatically start scanning on mobile
          if (isMobileBrowser) {
            setTimeout(() => {
              startScanning();
            }, 1000);
          }
        } else {
          throw new Error('No cameras found on your device');
        }
      } catch (cameraErr) {
        console.error('Error getting cameras:', cameraErr);
        // If we can't enumerate cameras but have permission, create a fallback
        if (isMobileBrowser) {
          // For mobile, create a default camera entry
          setCameras([{ id: "environment", label: "Back Camera" }]);
          setSelectedCamera("environment");
          
          // Auto start scanning with environment camera
          setTimeout(() => {
            startScanning();
          }, 1000);
        } else {
          throw new Error('Could not access device cameras');
        }
      }
    } catch (err) {
      console.error('Permission error:', err);
      setPermissionState('denied');
      
      // Special handling for Xiaomi/Redmi devices
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isXiaomi = /xiaomi|redmi|poco/i.test(userAgent.toLowerCase());
      
      if (isXiaomi) {
        setIsUnsupportedDevice(true);
        setError("Your device has limited camera API support in browser. Please use the camera or file upload options below.");
      } 
      // Specific error messages for different scenarios
      else if (err.message && err.message.includes('undefined')) {
        setError('Camera API not accessible on this device. Try using the alternate methods below.');
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access was denied. Please allow camera permissions in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please make sure your device has a working camera.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application. Please close other apps using the camera.');
      } else if (err.name === 'OverconstrainedError') {
        setError('The requested camera settings are not supported by your device.');
      } else {
        setError(`Camera error: ${err.message || 'Unknown error accessing camera'}`);
      }
      
      // Show alternative methods for any camera error
      setUseDirectInput(true);
    }
  };

  const startScanning = async () => {
    // Request camera permissions if not already granted
    if (permissionState !== 'granted') {
      await checkCameraPermission();
      return;
    }
    
    if (!selectedCamera) {
      setError('No camera selected');
      return;
    }

    try {
      setError(null);
      setScanning(true);
      
      // Create new scanner instance
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerInstanceRef.current = html5QrCode;
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // If on mobile, use special config for better compatibility
      if (isMobileBrowser) {
        config.experimentalFeatures = { 
          useBarCodeDetectorIfSupported: true 
        };
        config.formats = ['qr_code']; // Focus just on QR codes for better performance
      }
      
      // Start scanner with selected camera
      await html5QrCode.start(
        selectedCamera,
        config,
        (decodedText, decodedResult) => {
          // Success vibration feedback for mobile
          if (navigator.vibrate && isMobileBrowser) {
            navigator.vibrate(200); // Vibrate for 200ms on mobile 
          }
          
          // On successful scan
          setScanResult(decodedText);
          if (onScanSuccess) {
            onScanSuccess(decodedText, decodedResult);
          }
          
          // Stop scanning after successful scan
          html5QrCode.stop().catch(console.error);
          setScanning(false);
        },
        (errorMessage) => {
          // Ignore frequent scan errors
          if (errorMessage.includes('No QR code found')) {
            return;
          }
          console.error('QR Scan Error:', errorMessage);
        }
      );
    } catch (err) {
      setError('Failed to start scanner: ' + (err.message || 'Unknown error'));
      setScanning(false);
      console.error('Scanner start error:', err);
      // If scanner fails to start, offer alternative methods
      setUseDirectInput(true);
    }
  };

  const stopScanning = () => {
    if (scannerInstanceRef.current) {
      scannerInstanceRef.current.stop().then(() => {
        setScanning(false);
      }).catch(err => {
        console.error('Failed to stop scanner:', err);
      });
    }
  };
  
  // Handle file upload for QR code scanning
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setError(null);
    
    if (scannerInstanceRef.current) {
      scannerInstanceRef.current.stop().catch(console.error);
    }
    
    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerInstanceRef.current = html5QrCode;
      
      html5QrCode.scanFile(file, true)
        .then((decodedText) => {
          setScanResult(decodedText);
          if (onScanSuccess) {
            onScanSuccess(decodedText, { result: decodedText });
          }
        })
        .catch(err => {
          setError("Couldn't read QR code from image. Please try another image or enter code manually.");
          console.error("QR File Scan Error:", err);
        });
    } catch (err) {
      setError("Error processing image: " + (err.message || "Unknown error"));
      console.error("File processing error:", err);
    }
  };

  // Handle manual code input
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setScanResult(manualInput.trim());
      if (onScanSuccess) {
        onScanSuccess(manualInput.trim(), { result: manualInput.trim() });
      }
    }
  };

  const handleCameraChange = (e) => {
    const cameraId = e.target.value;
    setSelectedCamera(cameraId);
    
    // If already scanning, restart with new camera
    if (scanning && scannerInstanceRef.current) {
      stopScanning();
      setTimeout(startScanning, 500); // Give it time to stop properly
    }
  };

  // Stop scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Render permission request state
  const renderPermissionState = () => {
    if (permissionState === 'denied') {
      return (
        <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          <ExclamationCircleIcon className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Camera Permission Required</h3>
          <p className="text-yellow-700 mb-4">
            {isMobileBrowser ? 
              'Please allow camera access in your browser settings. You may need to reload the page after granting permission.' :
              'Please allow camera access to scan QR codes. You may need to update permissions in your browser settings.'
            }
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={checkCameraPermission}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              <ArrowPathIcon className="h-5 w-5 inline mr-2" />
              Try Again
            </button>
            
            {isMobileBrowser && (
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Reload Page
              </button>
            )}
          </div>
        </div>
      );
    }
    
    if (permissionState === 'requesting') {
      return (
        <div className="text-center p-6">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-blue-200 rounded mb-3"></div>
            <div className="h-3 w-40 bg-blue-100 rounded"></div>
          </div>
          <p className="mt-4 text-gray-700">Starting camera...</p>
          {isMobileBrowser && (
            <p className="mt-2 text-sm text-yellow-600">
              If no permission dialog appears, check your browser settings or notification bar.
            </p>
          )}
        </div>
      );
    }
    
    return null;
  };

  // Enhanced alternative input methods with direct camera capture
  const renderAlternativeMethods = () => {
    if (!useDirectInput && !showDirectCaptureOption) return null;
    
    return (
      <div className={`${isUnsupportedDevice ? '' : 'mt-6 pt-6 border-t border-gray-200'}`}>
        {!isUnsupportedDevice && useDirectInput && (
          <h3 className="text-lg font-medium text-gray-800 mb-4">Alternative Methods</h3>
        )}
        
        {/* Direct camera capture - this uses the native camera app */}
        {showDirectCaptureOption && (
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <CameraIcon className="h-5 w-5 text-purple-500 mr-2" />
              <h4 className="font-medium text-gray-700">Take Photo of QR Code</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Use your device camera to capture the QR code directly
            </p>
            <input
              type="file"
              ref={cameraCaptureRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => cameraCaptureRef.current?.click()}
              className="w-full px-4 py-3 bg-purple-100 text-purple-700 border border-purple-200 rounded-md hover:bg-purple-200 flex items-center justify-center"
            >
              <CameraIcon className="h-5 w-5 mr-2" />
              Open Camera to Scan QR Code
            </button>
          </div>
        )}
        
        {/* Upload image with QR code */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <PhotoIcon className="h-5 w-5 text-blue-500 mr-2" />
            <h4 className="font-medium text-gray-700">Upload QR Code Image</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Select an existing image of the QR code from your gallery
          </p>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 bg-blue-100 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-200 flex items-center justify-center"
          >
            <PhotoIcon className="h-5 w-5 mr-2" />
            Select Image with QR Code
          </button>
        </div>
        
        {/* Manual input */}
        <div>
          <div className="flex items-center mb-2">
            <DocumentTextIcon className="h-5 w-5 text-green-500 mr-2" />
            <h4 className="font-medium text-gray-700">Enter Code Manually</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Type the code if you can read it directly
          </p>
          <form onSubmit={handleManualSubmit} className="flex flex-col space-y-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter code here..."
              className="w-full px-3 py-3 border border-gray-300 rounded-md"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Submit Code
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderHttpsInfo = () => {
    if (window.location.protocol === 'https:' || 
        window.location.hostname === 'localhost' || 
        /^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(window.location.hostname)) {
      return null;
    }
    
    return (
      <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mb-4 flex items-start">
        <InformationCircleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-700">
          <p>Camera access works best on HTTPS connections. You're currently using HTTP which may cause issues.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blue blurred backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-blue-800/30" 
        onClick={onClose}
      ></div>
      
      {/* Modal content */}
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full z-10 relative mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">QR Code Scanner</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {renderHttpsInfo()}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
            <p>{error}</p>
            {isMobileBrowser && !isUnsupportedDevice && (
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-sm text-red-700 underline"
              >
                Reload page and try again
              </button>
            )}
          </div>
        )}

        {/* For unsupported devices, show direct alternative methods */}
        {isUnsupportedDevice ? (
          <div className="mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Mobile Scanning Options</h3>
              <p className="text-blue-700">
                Please use one of these methods to scan your QR code:
              </p>
            </div>
            {renderAlternativeMethods()}
          </div>
        ) : (
          <>
            {/* Permission state UI */}
            {renderPermissionState()}

            {permissionState === 'granted' && (
              <>
                {cameras.length > 1 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Camera
                    </label>
                    <select
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={selectedCamera || ''}
                      onChange={handleCameraChange}
                      disabled={scanning}
                    >
                      {cameras.map((camera) => (
                        <option key={camera.id} value={camera.id}>
                          {camera.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div id="qr-reader" ref={qrScannerRef} className="w-full" style={{ minHeight: '300px' }}></div>

                {scanResult ? (
                  <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md">
                    <p className="text-green-800 font-medium">QR Code Scanned:</p>
                    <p className="text-green-700 break-all">{scanResult}</p>
                    
                    <button
                      onClick={() => {
                        setScanResult(null);
                        setScanning(false);
                      }}
                      className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Scan Another
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex justify-center">
                    {!scanning ? (
                      <button
                        onClick={startScanning}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                        disabled={!selectedCamera}
                      >
                        <CameraIcon className="h-5 w-5 mr-2" />
                        Start Scanning
                      </button>
                    ) : (
                      <button
                        onClick={stopScanning}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Stop Scanning
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {permissionState === 'initial' && !useDirectInput && (
              <div className="text-center py-8">
                <CameraIcon className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Camera Access Required</h3>
                <p className="text-gray-600 mb-6">
                  To scan QR codes, we need permission to use your camera.
                  {isMobileBrowser && " If no permission popup appears, check your notification bar or browser settings."}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={checkCameraPermission}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm w-full"
                  >
                    Allow Camera Access
                  </button>
                  
                  <button 
                    onClick={() => {
                      setUseDirectInput(true);
                      setShowDirectCaptureOption(true);
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 w-full"
                  >
                    Use Alternative Methods
                  </button>
                </div>
              </div>
            )}
            
            {/* Alternative input methods */}
            {renderAlternativeMethods()}
          </>
        )}

        {/* Hidden inputs for file uploads */}
        <input 
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        
        <input 
          type="file"
          ref={cameraCaptureRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
        
        {!isUnsupportedDevice && !scanResult && permissionState === 'granted' && (
          <div className="mt-4 text-sm text-gray-600">
            <p className="text-center">Position the QR code within the scanner frame</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeScanner;