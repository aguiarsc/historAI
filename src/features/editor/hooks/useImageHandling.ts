import { useState, useRef, useCallback } from 'react';

export function useImageHandling(
  insertImage: (imageUrl: string, altText?: string) => void
) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }, []);

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      if (file.type.startsWith('image/')) {
        const base64 = await imageToBase64(file);
        insertImage(base64, file.name);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }, [insertImage, imageToBase64]);

  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleDragEvents = {
    onDragOver: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    }, []),
    
    onDragLeave: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
    }, []),
    
    onDrop: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      
      if (e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        handleImageUpload(file);
      }
    }, [handleImageUpload])
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleImageUpload(file);
          break;
        }
      }
    }
  }, [handleImageUpload]);

  return {
    dragOver,
    fileInputRef,
    handleImageUpload,
    openFileSelector,
    handleDragEvents,
    handlePaste
  };
}
