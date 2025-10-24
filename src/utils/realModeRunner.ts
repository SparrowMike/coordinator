import { coordinateUploads, getCoordinatorState } from '../coordinator';
import { type FileItem } from '../types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const randomDelay = (baseTime: number, variance = 0.3): number => {
  const varianceAmount = baseTime * variance;
  return baseTime + (Math.random() * varianceAmount * 2 - varianceAmount);
};

type AddToTimelineFunc = (message: string, type: 'phase1' | 'phase2' | 'complete') => void;

/**
 * Executes real upload using the actual coordinator with generator pattern
 * Timeline messages now match simulation mode format
 */
export const runRealUpload = async (
  files: FileItem[],
  addToTimeline: AddToTimelineFunc
) => {
  addToTimeline('🚀 [REAL] Starting real upload coordination...', 'phase1');

  try {
    // Convert FileItem[] to coordinator format
    const coordinatorFiles = files.map((f) => ({
      fileId: f.id,
      fileSize: f.size * 1024 * 1024, // Convert MB to bytes
    }));

    // Define the initiate function (Phase 1)
    // Note: We can't accurately track concurrent active count because processConcurrently
    // is a black box. We only get called at function boundaries.
    const initiateFn = async (fileId: string) => {
      const file = files.find(f => f.id === fileId);
      const fileSize = file?.size || 0;

      addToTimeline(
        `🟡 [REAL] "${fileId}" (${fileSize}MB) - initiate started`,
        'phase1'
      );

      await delay(randomDelay(2000)); // Simulate API call

      // Note: Can't predict Phase 2 behavior here because Phase 1 completes
      // entirely before Phase 2 starts (sequential phases in coordinateUploads)
      addToTimeline(
        `✓ [REAL] "${fileId}" initiate complete`,
        'phase1'
      );

      return { fileId, uploadUrl: `https://upload.example.com/${fileId}` };
    };

    // Define the upload function (Phase 2)
    const uploadFn = async (fileId: string) => {
      const file = files.find(f => f.id === fileId);
      const fileSize = file?.size || 0;

      // By the time uploadFn is called, the coordinator has already acquired the slot
      // Query state to show current allocation
      const state = getCoordinatorState();
      const mode = state.maxConcurrentSlots === 3 ? '🔴 LARGE mode' : '🟢 SMALL mode';

      addToTimeline(
        `🔵 [REAL] "${fileId}" (${fileSize}MB) - upload started [${state.activeUploads.length}/${state.maxConcurrentSlots}] ${mode}`,
        'phase2'
      );

      await delay(randomDelay(8000)); // Simulate upload

      addToTimeline(
        `✅ [REAL] "${fileId}" upload completed`,
        'complete'
      );

      return { fileId, success: true };
    };

    // Actually use the generator pattern!
    const startTime = Date.now();

    addToTimeline(`📋 [REAL] Phase 1: Starting initiation for ${files.length} files...`, 'phase1');

    const results = await coordinateUploads(coordinatorFiles, initiateFn, uploadFn);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    addToTimeline(`📋 [REAL] Phase 2: All uploads completed!`, 'phase2');

    // Report results
    const initiateSuccess = results.initiateResults.filter((r) => r.status === 'fulfilled').length;
    const initiateFailed = results.initiateResults.filter((r) => r.status === 'rejected').length;
    const uploadSuccess = results.uploadResults.filter((r) => r.status === 'fulfilled').length;
    const uploadFailed = results.uploadResults.filter((r) => r.status === 'rejected').length;

    addToTimeline(
      `🎉 [REAL] All done! Initiated: ${initiateSuccess}/${files.length}, Uploaded: ${uploadSuccess}/${files.length} (${duration}s)`,
      'complete'
    );

    if (initiateFailed > 0 || uploadFailed > 0) {
      addToTimeline(
        `⚠️ [REAL] Some failures - Initiate: ${initiateFailed}, Upload: ${uploadFailed}`,
        'complete'
      );
    }

    return { success: true, results, duration: Number(duration) };
  } catch (error) {
    addToTimeline(`❌ [REAL] Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'complete');
    return { success: false, error, duration: 0 };
  }
};
