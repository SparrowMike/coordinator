import { useEffect, useRef } from 'react';
import {
  MAX_CONCURRENT_INITIATES,
  MAX_CONCURRENT_LARGE,
  MAX_CONCURRENT_SMALL,
  MAX_CONCURRENT_UPLOAD_TRIGGERS,
  SMALL_FILE_THRESHOLD,
  type FileItem,
} from '../types';

type SimulationEngineProps = {
  speed: number;
  activeInitiates: FileItem[];
  initiateQueue: FileItem[];
  activeTriggers: FileItem[];
  triggerQueue: FileItem[];
  activeUploads: FileItem[];
  onUpdateInitiates: (updater: (prev: FileItem[]) => FileItem[]) => void;
  onUpdateInitiateQueue: (updater: (prev: FileItem[]) => FileItem[]) => void;
  onUpdateTriggers: (updater: (prev: FileItem[]) => FileItem[]) => void;
  onUpdateTriggerQueue: (updater: (prev: FileItem[]) => FileItem[]) => void;
  onUpdateUploads: (updater: (prev: FileItem[]) => FileItem[]) => void;
  onAddToTimeline: (message: string, type?: 'phase1' | 'phase2' | 'complete' | 'trigger') => void;
  onIncrementCompleted: (count: number) => void;
};

export const useSimulationEngine = ({
  speed,
  activeInitiates,
  initiateQueue,
  activeTriggers,
  triggerQueue,
  activeUploads,
  onUpdateInitiates,
  onUpdateInitiateQueue,
  onUpdateTriggers,
  onUpdateTriggerQueue,
  onUpdateUploads,
  onAddToTimeline,
  onIncrementCompleted,
}: SimulationEngineProps) => {
  const speedRef = useRef(speed);
  const activeInitiatesRef = useRef<FileItem[]>([]);
  const activeTriggersRef = useRef<FileItem[]>([]);
  const activeUploadsRef = useRef<FileItem[]>([]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    activeInitiatesRef.current = activeInitiates;
  }, [activeInitiates]);

  useEffect(() => {
    activeTriggersRef.current = activeTriggers;
  }, [activeTriggers]);

  useEffect(() => {
    activeUploadsRef.current = activeUploads;
  }, [activeUploads]);

  useEffect(() => {
    if (speed === 0) return;

    const interval = setInterval(() => {
      const currentSpeed = speedRef.current;
      if (currentSpeed === 0) return;

      const tickAmount = currentSpeed / 100;

      // ============================================================================
      // PHASE 1: Process initiate queue - start new initiates if slots available
      // ============================================================================
      onUpdateInitiateQueue(prevQueue => {
        if (prevQueue.length === 0) return prevQueue;

        const currentActive = activeInitiatesRef.current;
        const slotsAvailable = MAX_CONCURRENT_INITIATES - currentActive.length;

        if (slotsAvailable <= 0) return prevQueue;

        const toStart = prevQueue.slice(0, slotsAvailable);

        if (toStart.length === 0) return prevQueue;

        onUpdateInitiates(active => {
          const newActive = toStart.map(file => ({
            ...file,
            startTime: Date.now()
          }));

          const updatedActive = [...active, ...newActive];

          newActive.forEach(file => {
            onAddToTimeline(
              `🟡 "${file.id}" (${file.size}MB) - initiate started [${updatedActive.length}/${MAX_CONCURRENT_INITIATES}]`,
              'phase1'
            );
          });

          return updatedActive;
        });

        return prevQueue.slice(toStart.length);
      });

      // ============================================================================
      // PHASE 1: Update active initiates progress
      // ============================================================================
      onUpdateInitiates(active => {
        if (active.length === 0) return active;

        const completed: FileItem[] = [];
        const remaining: FileItem[] = [];

        active.forEach(file => {
          const newProgress = Math.min(file.progress + tickAmount * (1000 / file.initiateTime), 1);

          if (newProgress >= 1) {
            completed.push(file);

            // When Phase 1 completes, try to start trigger (Phase 2)
            const currentTriggers = activeTriggersRef.current;

            if (currentTriggers.length < MAX_CONCURRENT_UPLOAD_TRIGGERS) {
              // Start trigger immediately
              onUpdateTriggers(triggers => {
                // Guard against duplicates
                if (triggers.some(f => f.id === file.id)) {
                  return triggers;
                }

                const newTrigger = {
                  ...file,
                  triggerStartTime: Date.now(),
                  triggerState: 'started' as const,
                };

                const updatedTriggers = [...triggers, newTrigger];
                onAddToTimeline(
                  `✓ "${file.id}" initiate complete → trigger started [${updatedTriggers.length}/${MAX_CONCURRENT_UPLOAD_TRIGGERS}]`,
                  'trigger'
                );

                return updatedTriggers;
              });
            } else {
              // Queue for trigger slot
              onUpdateTriggerQueue(queue => {
                // Guard against duplicates
                if (queue.some(f => f.id === file.id)) {
                  return queue;
                }

                onAddToTimeline(`✓ "${file.id}" initiate complete → queued for trigger slot`, 'phase1');
                return [...queue, file];
              });
            }
          } else {
            remaining.push({ ...file, progress: newProgress });
          }
        });

        return remaining;
      });

      // ============================================================================
      // PHASE 2: Process trigger queue - start new triggers if slots available
      // ============================================================================
      onUpdateTriggerQueue(prevQueue => {
        if (prevQueue.length === 0) return prevQueue;

        const currentTriggers = activeTriggersRef.current;
        const slotsAvailable = MAX_CONCURRENT_UPLOAD_TRIGGERS - currentTriggers.length;

        if (slotsAvailable <= 0) return prevQueue;

        const toStart = prevQueue.slice(0, slotsAvailable);

        if (toStart.length === 0) return prevQueue;

        onUpdateTriggers(triggers => {
          const newTriggers = toStart.map(file => ({
            ...file,
            triggerStartTime: Date.now(),
            triggerState: 'started' as const,
          }));

          const updatedTriggers = [...triggers, ...newTriggers];

          newTriggers.forEach(file => {
            onAddToTimeline(
              `🔵 "${file.id}" trigger started from queue [${updatedTriggers.length}/${MAX_CONCURRENT_UPLOAD_TRIGGERS}]`,
              'trigger'
            );
          });

          return updatedTriggers;
        });

        return prevQueue.slice(toStart.length);
      });

      // ============================================================================
      // PHASE 2: Process triggers trying to acquire bandwidth slots (gatekeeper)
      // ============================================================================
      onUpdateTriggers(triggers => {
        if (triggers.length === 0) return triggers;

        const currentUploads = activeUploadsRef.current;
        const currentMax = currentUploads.some(f => f.size > SMALL_FILE_THRESHOLD)
          ? MAX_CONCURRENT_LARGE
          : MAX_CONCURRENT_SMALL;

        return triggers.map(trigger => {
          // Already uploading or waiting? Don't change state
          if (trigger.triggerState === 'uploading' || trigger.triggerState === 'waiting-at-gatekeeper') {
            return trigger;
          }

          // Just started, try to acquire bandwidth slot
          if (trigger.triggerState === 'started') {
            // Check if bandwidth slots available
            if (currentUploads.length < currentMax && !currentUploads.some(u => u.id === trigger.id)) {
              // Acquire slot and start upload
              onUpdateUploads(uploads => {
                if (uploads.some(u => u.id === trigger.id)) return uploads;

                const newUpload = {
                  ...trigger,
                  uploadStartTime: Date.now(),
                };

                const updatedUploads = [...uploads, newUpload];
                const mode = updatedUploads.some(f => f.size > SMALL_FILE_THRESHOLD)
                  ? '🔴 LARGE mode'
                  : '🟢 SMALL mode';

                onAddToTimeline(
                  `✓ "${trigger.id}" passed gatekeeper → uploading [${updatedUploads.length}/${currentMax}] ${mode}`,
                  'phase2'
                );

                return updatedUploads;
              });

              return { ...trigger, triggerState: 'uploading' as const };
            } else {
              // Blocked at gatekeeper
              onAddToTimeline(
                `⏸️ "${trigger.id}" blocked at gatekeeper (${currentUploads.length}/${currentMax} slots used)`,
                'phase2'
              );
              return { ...trigger, triggerState: 'waiting-at-gatekeeper' as const };
            }
          }

          return trigger;
        });
      });

      // ============================================================================
      // PHASE 2: Update active uploads progress
      // ============================================================================
      onUpdateUploads(active => {
        if (active.length === 0) return active;

        const completed: FileItem[] = [];
        const remaining: FileItem[] = [];

        active.forEach(file => {
          const newProgress = Math.min(file.uploadProgress + tickAmount * (1000 / file.uploadTime), 1);

          if (newProgress >= 1) {
            completed.push(file);
            onAddToTimeline(`✅ "${file.id}" upload completed`, 'complete');

            // Remove from triggers too (frees up trigger slot)
            onUpdateTriggers(triggers => {
              return triggers.filter(t => t.id !== file.id);
            });

            // Try to unblock a waiting trigger at gatekeeper
            onUpdateTriggers(triggers => {
              const currentUploads = activeUploadsRef.current.filter(u => u.id !== file.id);
              const currentMax = currentUploads.some(f => f.size > SMALL_FILE_THRESHOLD)
                ? MAX_CONCURRENT_LARGE
                : MAX_CONCURRENT_SMALL;

              return triggers.map(trigger => {
                // Find first waiting trigger and unblock it
                if (trigger.triggerState === 'waiting-at-gatekeeper' && currentUploads.length < currentMax) {
                  onAddToTimeline(
                    `✓ "${trigger.id}" unblocked from gatekeeper → uploading`,
                    'phase2'
                  );

                  // Start upload for this trigger
                  onUpdateUploads(uploads => {
                    if (uploads.some(u => u.id === trigger.id)) return uploads;

                    return [...uploads, { ...trigger, uploadStartTime: Date.now() }];
                  });

                  return { ...trigger, triggerState: 'uploading' as const };
                }
                return trigger;
              });
            });
          } else {
            remaining.push({ ...file, uploadProgress: newProgress });
          }
        });

        if (completed.length > 0) {
          onIncrementCompleted(completed.length);
        }

        return remaining;
      });
    }, 10);

    return () => clearInterval(interval);
  }, [
    speed,
    onUpdateInitiates,
    onUpdateInitiateQueue,
    onUpdateTriggers,
    onUpdateTriggerQueue,
    onUpdateUploads,
    onAddToTimeline,
    onIncrementCompleted,
  ]);
};
