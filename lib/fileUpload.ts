// Optimized file upload utilities for faster, more efficient uploads
export class FileUploadOptimizer {
  // Compress image files to reduce upload time
  static async compressImage(file: File, maxSizeMB: number = 2, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Upload with progress tracking and retry logic
  static async uploadWithProgress(
    file: File,
    uploadFn: (file: File) => Promise<any>,
    onProgress?: (progress: number) => void,
    maxRetries: number = 3
  ): Promise<any> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        onProgress?.(10 + (attempt * 10)); // Show initial progress
        
        const result = await uploadFn(file);
        onProgress?.(100);
        return result;
        
      } catch (error) {
        attempt++;
        console.warn(`Upload attempt ${attempt} failed:`, error);
        
        if (attempt >= maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        onProgress?.(attempt * 15);
      }
    }
  }

  // Validate file before upload
  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size too large. Please choose a file under 10MB.' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please upload a JPG, PNG, or PDF file.' };
    }
    
    return { valid: true };
  }

  // Prepare file for upload (compress if needed)
  static async prepareFile(file: File): Promise<File> {
    // Only compress images, leave PDFs as-is
    if (file.type.startsWith('image/')) {
      // If image is larger than 2MB, compress it
      if (file.size > 2 * 1024 * 1024) {
        console.log('📦 Compressing image for faster upload...');
        return await this.compressImage(file, 2, 0.85);
      }
    }
    
    return file;
  }
}

// Enhanced upload hook
export const useOptimizedUpload = () => {
  const uploadFile = async (
    file: File,
    uploadFunction: (file: File) => Promise<any>,
    onProgress?: (progress: number) => void
  ) => {
    // Validate file
    const validation = FileUploadOptimizer.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    onProgress?.(5);

    // Prepare file (compress if needed)
    const preparedFile = await FileUploadOptimizer.prepareFile(file);
    onProgress?.(15);

    // Upload with retry logic
    return await FileUploadOptimizer.uploadWithProgress(
      preparedFile,
      uploadFunction,
      (progress) => onProgress?.(15 + (progress * 0.85)), // Scale progress from 15% to 100%
      3 // Max retries
    );
  };

  return { uploadFile };
};