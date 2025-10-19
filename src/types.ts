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
};

export type TimelineEntry = {
  id: string;
  time: string;
  message: string;
  type: 'phase1' | 'phase2' | 'complete';
};

export const SMALL_FILE_THRESHOLD = 65;
export const MAX_CONCURRENT_SMALL = 5;
export const MAX_CONCURRENT_LARGE = 3;
export const MAX_CONCURRENT_INITIATES = 10;
export const BASE_INITIATE_TIME = 2000;
export const BASE_UPLOAD_TIME = 8000;
export const TIMING_VARIANCE = 0.3;
