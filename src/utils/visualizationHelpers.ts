import { MAX_CONCURRENT_UPLOAD_TRIGGERS, type DemoMode, type FileItem } from '../types';

/**
 * Maps current upload state to visual trigger representation
 * In simulation mode, active uploads are shown as "uploading" triggers
 * and upload queue items are shown as "waiting-at-gatekeeper" triggers
 */
export const mapToVisualTriggers = (
  mode: DemoMode,
  uploadTriggers: FileItem[],
  activeUploads: FileItem[],
  uploadQueue: FileItem[]
): FileItem[] => {
  if (mode !== 'simulation') {
    return uploadTriggers;
  }

  const triggers: FileItem[] = [];

  // Active uploads are shown as "uploading"
  activeUploads.forEach(file => {
    triggers.push({ ...file, triggerState: 'uploading' });
  });

  // Upload queue items are shown as "waiting-at-gatekeeper"
  uploadQueue.forEach(file => {
    triggers.push({ ...file, triggerState: 'waiting-at-gatekeeper' });
  });

  return triggers.slice(0, MAX_CONCURRENT_UPLOAD_TRIGGERS);
};
