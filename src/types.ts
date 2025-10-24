export type DemoMode = 'simulation' | 'real';

export type UploadTriggerState =
  | 'idle'
  | 'started'
  | 'waiting-at-gatekeeper'
  | 'uploading'
  | 'completed';

export type FileItem = {
  id: string;
  size: number;
  key: string;
  progress: number;
  uploadProgress: number;
  initiateTime: number;
  uploadTime: number;
  startTime?: number;
  uploadStartTime?: number;
  triggerState?: UploadTriggerState;
  triggerStartTime?: number;
};

export type TimelineEntry = {
  id: string;
  time: string;
  message: string;
  type: 'phase1' | 'phase2' | 'complete' | 'trigger' | 'gatekeeper';
};

export const SMALL_FILE_THRESHOLD = 65;
export const MAX_CONCURRENT_SMALL = 5;
export const MAX_CONCURRENT_LARGE = 3;
export const MAX_CONCURRENT_INITIATES = 10;
export const MAX_CONCURRENT_UPLOAD_TRIGGERS = 10;
export const BASE_INITIATE_TIME = 2000;
export const BASE_UPLOAD_TIME = 8000;
export const TIMING_VARIANCE = 0.3;
