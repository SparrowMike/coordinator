/**
 * Upload Coordinator - Manages concurrent file uploads with dynamic slot allocation
 *
 * - Small files (≤65MB): Max 5 concurrent uploads
 * - Large files (>65MB): Max 3 concurrent uploads
 * - FIFO queue for waiting uploads
 * - Concurrent initiate request management
 */

const SMALL_FILE_THRESHOLD = 65 * 1024 * 1024; // 65MB in bytes
const MAX_CONCURRENT_SMALL = 5;
const MAX_CONCURRENT_LARGE = 3;
const MAX_CONCURRENT_INITIATES = 10; // Max concurrent initiate requests

type FileId = string;

type QueueItem = {
  fileId: FileId;
  fileSize: number;
  resolve: () => void;
};

type InitiateQueueItem = {
  fileId: FileId;
  initiateFn: () => Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
};

// Module-level state
//
// Two separate phases need separate tracking:
//
// INFO: 1. INITIATE PHASE: Quick API calls to get upload URLs (Phase 1)
//    - Limited to 10 concurrent to avoid overwhelming the API
//    - Managed by queueFileInitiate()
const activeInitiates = new Set<FileId>(); // Files currently being initiated (at capacity limit)
const initiateQueue: InitiateQueueItem[] = []; // Files waiting for initiation (queued when at limit)

// INFO: 2. UPLOAD PHASE: Heavy bandwidth operations to upload file chunks (Phase 2)
//    - Limited to 3-5 concurrent based on file size to manage bandwidth
//    - Managed by acquireUploadSlot() / releaseUploadSlot()
const activeUploads = new Map<FileId, number>(); // Files currently uploading (at capacity limit) - Map stores fileSize for dynamic slot calculation
const queue: QueueItem[] = []; // Files waiting to upload (queued when at limit)

/**
 * Determines max concurrent uploads based on current active uploads
 * If any active upload is large, limit to 3. Otherwise allow 5.
 */
const getMaxConcurrentSlots = (): number => {
  for (const fileSize of activeUploads.values()) {
    if (fileSize > SMALL_FILE_THRESHOLD) {
      return MAX_CONCURRENT_LARGE;
    }
  }
  return MAX_CONCURRENT_SMALL;
};

/**
 * Tries to process the next item in queue if slots are available
 */
const processQueue = (): void => {
  if (queue.length === 0) return;

  const maxSlots = getMaxConcurrentSlots();

  while (queue.length > 0 && activeUploads.size < maxSlots) {
    const next = queue.shift()!;
    activeUploads.set(next.fileId, next.fileSize);
    next.resolve();
  }
};

/**
 * Acquires an upload slot for a file
 * Returns immediately if slot available, otherwise queues and waits
 *
 * @param fileId - Unique identifier for the file
 * @param fileSize - Size of the file in bytes
 * @returns Promise that resolves when slot is acquired
 */
export const acquireUploadSlot = async (
  fileId: FileId,
  fileSize: number,
): Promise<void> => {
  const maxSlots = getMaxConcurrentSlots();

  if (activeUploads.size < maxSlots) {
    activeUploads.set(fileId, fileSize);
    return Promise.resolve();
  }

  // Queue the upload
  return new Promise<void>((resolve) => {
    queue.push({ fileId, fileSize, resolve });
  });
};

/**
 * Releases an upload slot and processes next item in queue
 *
 * @param fileId - Unique identifier for the file
 */
export const releaseUploadSlot = (fileId: FileId): void => {
  activeUploads.delete(fileId);
  processQueue();
};

/**
 * Processes the initiate queue with concurrency control
 * Executes queued initiate tasks up to MAX_CONCURRENT_INITIATES
 */
const processInitiateQueue = async (): Promise<void> => {
  while (initiateQueue.length > 0 && activeInitiates.size < MAX_CONCURRENT_INITIATES) {
    const next = initiateQueue.shift()!;
    activeInitiates.add(next.fileId);

    // Execute the initiate function
    next.initiateFn()
      .then(() => {
        activeInitiates.delete(next.fileId);
        next.resolve();
        processInitiateQueue(); // Process next items
      })
      .catch((error) => {
        activeInitiates.delete(next.fileId);
        next.reject(error);
        processInitiateQueue(); // Process next items even on error
      });
  }
};

/**
 * Queues a file initiate operation with concurrency control
 *
 * @param fileId - Unique identifier for the file
 * @param initiateFn - Async function that performs the initiate operation
 * @returns Promise that resolves when initiate completes
 */
export const queueFileInitiate = async (
  fileId: FileId,
  initiateFn: () => Promise<void>,
): Promise<void> => {
  if (activeInitiates.size < MAX_CONCURRENT_INITIATES) {
    activeInitiates.add(fileId);
    try {
      await initiateFn();
      activeInitiates.delete(fileId);
      processInitiateQueue();
    } catch (error) {
      activeInitiates.delete(fileId);
      processInitiateQueue();
      throw error;
    }
    return;
  }

  // Otherwise, queue it
  return new Promise<void>((resolve, reject) => {
    initiateQueue.push({ fileId, initiateFn, resolve, reject });
  });
};

/**
 * Gets the current state for UI observability
 * @returns Current coordinator state snapshot
 */
export const getCoordinatorState = () => ({
  activeInitiates: Array.from(activeInitiates),
  initiateQueueSize: initiateQueue.length,
  activeUploads: Array.from(activeUploads.entries()).map(([fileId, fileSize]) => ({
    fileId,
    fileSize,
  })),
  uploadQueueSize: queue.length,
  maxConcurrentSlots: getMaxConcurrentSlots(),
});

/**
 * Resets all coordinator state (useful for testing/demo reset)
 */
export const resetCoordinator = (): void => {
  activeInitiates.clear();
  initiateQueue.length = 0;
  activeUploads.clear();
  queue.length = 0;
};
