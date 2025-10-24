import { useCallback, useState } from 'react';
import { runRealUpload } from '../utils/realModeRunner';
import type { DemoMode, FileItem } from '../types';

type UseRealModeProps = {
  mode: DemoMode;
  activeInitiates: FileItem[];
  initiateQueue: FileItem[];
  uploadTriggers: FileItem[];
  activeUploads: FileItem[];
  uploadQueue: FileItem[];
  onAddToTimeline: (message: string, type?: 'phase1' | 'phase2' | 'complete') => void;
};

export const useRealMode = ({
  mode,
  activeInitiates,
  initiateQueue,
  uploadTriggers,
  activeUploads,
  uploadQueue,
  onAddToTimeline,
}: UseRealModeProps) => {
  const [isRunningReal, setIsRunningReal] = useState(false);

  const runReal = useCallback(async () => {
    if (mode !== 'real' || isRunningReal) return;

    // Get all queued files plus active ones
    const allFiles = [...activeInitiates, ...initiateQueue, ...uploadTriggers, ...activeUploads, ...uploadQueue];

    if (allFiles.length === 0) {
      onAddToTimeline('⚠️ [REAL] No files to upload. Add some files first!', 'complete');
      return;
    }

    setIsRunningReal(true);
    onAddToTimeline(`🎬 [REAL] Starting with ${allFiles.length} files...`, 'phase1');

    // Small delay to ensure state update processes
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      await runRealUpload(allFiles, onAddToTimeline);
    } catch (error) {
      onAddToTimeline(`❌ [REAL] Unexpected error: ${error}`, 'complete');
    } finally {
      setIsRunningReal(false);
      onAddToTimeline('🏁 [REAL] Execution finished', 'complete');
    }
  }, [mode, isRunningReal, activeInitiates, initiateQueue, uploadTriggers, activeUploads, uploadQueue, onAddToTimeline]);

  return { runReal, isRunningReal };
};
