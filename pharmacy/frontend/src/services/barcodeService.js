import { Capacitor } from '@capacitor/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

const barcodeService = {
  checkPermissions: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { camera } = await BarcodeScanner.checkPermissions();
        return camera;
      } catch (err) {
        console.warn('Capacitor BarcodeScanner checkPermissions failed:', err);
      }
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return 'granted';
      } catch (e) {
        console.warn('Web mediaDevices permission check error:', e);
        return 'denied';
      }
    }
    return 'denied';
  },

  requestPermissions: async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { camera } = await BarcodeScanner.requestPermissions();
        return camera;
      } catch (err) {
        console.warn('Capacitor BarcodeScanner requestPermissions failed:', err);
      }
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        stream.getTracks().forEach(track => track.stop());
        return 'granted';
      } catch (e) {
        console.warn('Web mediaDevices request permission error:', e);
        return 'denied';
      }
    }
    return 'denied';
  },

  scan: async () => {
    // 1. Native Mobile Device Scanning
    if (Capacitor.isNativePlatform()) {
      try {
        const isSupported = await BarcodeScanner.isSupported();
        if (isSupported?.supported || isSupported) {
          const granted = await barcodeService.checkPermissions();
          if (granted !== 'granted') {
            const status = await barcodeService.requestPermissions();
            if (status !== 'granted') {
              throw new Error('Camera permission denied by user');
            }
          }
          const { barcodes } = await BarcodeScanner.scan();
          return barcodes && barcodes.length > 0 ? barcodes[0].displayValue : null;
        }
      } catch (nativeErr) {
        console.warn('Native BarcodeScanner error:', nativeErr);
        throw new Error(nativeErr.message || 'Camera access failed on native device');
      }
    }

    // 2. Web Browser Barcode Detection API
    if ('BarcodeDetector' in window) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();

        const barcodeDetector = new window.BarcodeDetector();
        const barcodes = await barcodeDetector.detect(video);

        stream.getTracks().forEach(track => track.stop());

        if (barcodes && barcodes.length > 0) {
          return barcodes[0].rawValue;
        }
      } catch (webErr) {
        if (webErr.name === 'NotAllowedError' || webErr.name === 'PermissionDeniedError') {
          throw new Error('Camera access permission denied in web browser');
        }
        console.warn('Web BarcodeDetector error:', webErr);
      }
    }

    // 3. Web Media Camera Stream Permission Prompt & Fallback
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        const code = window.prompt("Camera active! Scan or enter barcode number:");
        return code ? code.trim() : null;
      } catch (e) {
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          throw new Error('Camera permission denied. Please allow camera access in browser site settings.');
        }
        throw new Error('Camera device not found or already in use.');
      }
    }

    throw new Error('Camera barcode scanning is not supported on this browser. Please use a USB Barcode Scanner.');
  }
};

export default barcodeService;
