import { useCallback, useRef, useState } from 'react';
import {
  MAX_CONCURRENT_INITIATES,
  BASE_INITIATE_TIME,
  BASE_UPLOAD_TIME,
  TIMING_VARIANCE,
  type FileItem,
} from '../types';

type UseFileManagerProps = {
  activeInitiates: FileItem[];
  onUpdateInitiates: (updater: (prev: FileItem[]) => FileItem[]) => void;
  onUpdateInitiateQueue: (updater: (prev: FileItem[]) => FileItem[]) => void;
  onAddToTimeline: (message: string, type?: 'phase1' | 'phase2' | 'complete') => void;
};

export const useFileManager = ({
  activeInitiates,
  onUpdateInitiates,
  onUpdateInitiateQueue,
  onAddToTimeline,
}: UseFileManagerProps) => {
  const [fileCounter, setFileCounter] = useState(1);
  const fileCounterRef = useRef(1);
  const activeInitiatesRef = useRef<FileItem[]>([]);

  // Keep refs in sync
  activeInitiatesRef.current = activeInitiates;

  const getRandomTiming = useCallback((baseTime: number): number => {
    const variance = baseTime * TIMING_VARIANCE;
    return baseTime + (Math.random() * variance * 2 - variance);
  }, []);

  const addFile = useCallback((size: number) => {
    // Use ref to get current counter and increment atomically
    const currentCounter = fileCounterRef.current;
    fileCounterRef.current += 1;
    setFileCounter(fileCounterRef.current);

    const fileId = `File${currentCounter}`;
    const file: FileItem = {
      id: fileId,
      size,
      key: `${fileId}-${Date.now()}-${Math.random()}`, // Add random suffix for uniqueness
      progress: 0,
      uploadProgress: 0,
      initiateTime: getRandomTiming(BASE_INITIATE_TIME),
      uploadTime: getRandomTiming(BASE_UPLOAD_TIME)
    };

    const currentActive = activeInitiatesRef.current;
    if (currentActive.length < MAX_CONCURRENT_INITIATES) {
      onUpdateInitiates(active => {
        // Double-check we're not already adding this file (StrictMode guard)
        if (active.some(f => f.id === fileId)) {
          return active;
        }

        const newFile = {
          ...file,
          startTime: Date.now()
        };
        const updatedActive = [...active, newFile];
        onAddToTimeline(
          `🟡 "${fileId}" (${size}MB) - initiate started immediately [${updatedActive.length}/${MAX_CONCURRENT_INITIATES}]`,
          'phase1'
        );
        return updatedActive;
      });
    } else {
      onUpdateInitiateQueue(queue => {
        // Double-check we're not already adding this file (StrictMode guard)
        if (queue.some(f => f.id === fileId)) {
          return queue;
        }

        onAddToTimeline(`⏳ "${fileId}" (${size}MB) queued for initiate`, 'phase1');
        return [...queue, file];
      });
    }
  }, [onUpdateInitiates, onUpdateInitiateQueue, onAddToTimeline, getRandomTiming]);

  const resetCounter = useCallback(() => {
    fileCounterRef.current = 1;
    setFileCounter(1);
  }, []);

  return { addFile, fileCounter, resetCounter };
};
