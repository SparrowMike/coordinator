import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  SMALL_FILE_THRESHOLD,
  MAX_CONCURRENT_SMALL,
  MAX_CONCURRENT_LARGE,
  MAX_CONCURRENT_INITIATES,
  BASE_INITIATE_TIME,
  BASE_UPLOAD_TIME,
  TIMING_VARIANCE,
  type FileItem,
  type TimelineEntry,
} from './types';
import { SlotGrid } from './components/SlotGrid';
import { QueueDisplay } from './components/QueueDisplay';
import { Stats } from './components/Stats';
import { Timeline } from './components/Timeline';
import { Controls } from './components/Controls';
import { SpeedControl } from './components/SpeedControl';

function App() {
  const [fileCounter, setFileCounter] = useState(1);
  const [activeInitiates, setActiveInitiates] = useState<FileItem[]>([]);
  const [initiateQueue, setInitiateQueue] = useState<FileItem[]>([]);
  const [activeUploads, setActiveUploads] = useState<FileItem[]>([]);
  const [uploadQueue, setUploadQueue] = useState<FileItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [speed, setSpeed] = useState(0);

  const speedRef = useRef(speed);
  const fileCounterRef = useRef(1);
  const activeInitiatesRef = useRef<FileItem[]>([]);
  const activeUploadsRef = useRef<FileItem[]>([]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    activeInitiatesRef.current = activeInitiates;
  }, [activeInitiates]);

  useEffect(() => {
    activeUploadsRef.current = activeUploads;
  }, [activeUploads]);

  const initiateSlots = useMemo(
    () => Array.from({ length: MAX_CONCURRENT_INITIATES }, (_, i) => i),
    []
  );

  const uploadSlots = useMemo(
    () => Array.from({ length: MAX_CONCURRENT_SMALL }, (_, i) => i),
    []
  );

  const hasLargeFile = activeUploads.some(f => f.size > SMALL_FILE_THRESHOLD);
  const currentLimit = hasLargeFile ? MAX_CONCURRENT_LARGE : MAX_CONCURRENT_SMALL;
  const queueDepth = initiateQueue.length + uploadQueue.length;
  const totalFiles = fileCounter - 1;
  const activeCount = activeInitiates.length + activeUploads.length;

  const getRandomTiming = useCallback((baseTime: number): number => {
    const variance = baseTime * TIMING_VARIANCE;
    return baseTime + (Math.random() * variance * 2 - variance);
  }, []);

  const addToTimeline = useCallback((message: string, type: TimelineEntry['type'] = 'phase2') => {
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 1
    });

    setTimeline(prev => {
      const newEntry: TimelineEntry = {
        id: `${Date.now()}-${Math.random()}`,
        time,
        message,
        type
      };
      return [newEntry, ...prev].slice(0, 100);
    });
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
      setActiveInitiates(active => {
        // Double-check we're not already adding this file (StrictMode guard)
        if (active.some(f => f.id === fileId)) {
          return active;
        }

        const newFile = {
          ...file,
          startTime: Date.now()
        };
        const updatedActive = [...active, newFile];
        addToTimeline(
          `🟡 "${fileId}" (${size}MB) - initiate started immediately [${updatedActive.length}/${MAX_CONCURRENT_INITIATES}]`,
          'phase1'
        );
        return updatedActive;
      });
    } else {
      setInitiateQueue(queue => {
        // Double-check we're not already adding this file (StrictMode guard)
        if (queue.some(f => f.id === fileId)) {
          return queue;
        }

        addToTimeline(`⏳ "${fileId}" (${size}MB) queued for initiate`, 'phase1');
        return [...queue, file];
      });
    }
  }, [addToTimeline, getRandomTiming]);

  useEffect(() => {
    if (speed === 0) return;

    const interval = setInterval(() => {
      const currentSpeed = speedRef.current;
      if (currentSpeed === 0) return;

      const tickAmount = currentSpeed / 100;

      // Process initiate queue - start new initiates if slots available
      setInitiateQueue(prevQueue => {
        if (prevQueue.length === 0) return prevQueue;

        const currentActive = activeInitiatesRef.current;
        const slotsAvailable = MAX_CONCURRENT_INITIATES - currentActive.length;

        if (slotsAvailable <= 0) return prevQueue;

        const toStart = prevQueue.slice(0, slotsAvailable);

        if (toStart.length === 0) return prevQueue;

        setActiveInitiates(active => {
          const newActive = toStart.map(file => ({
            ...file,
            startTime: Date.now()
          }));

          const updatedActive = [...active, ...newActive];

          newActive.forEach(file => {
            addToTimeline(
              `🟡 "${file.id}" (${file.size}MB) - initiate started [${updatedActive.length}/${MAX_CONCURRENT_INITIATES}]`,
              'phase1'
            );
          });

          return updatedActive;
        });

        return prevQueue.slice(toStart.length);
      });

      // Update active initiates progress
      setActiveInitiates(active => {
        if (active.length === 0) return active;

        const completed: FileItem[] = [];
        const remaining: FileItem[] = [];

        active.forEach(file => {
          const newProgress = Math.min(file.progress + tickAmount * (1000 / file.initiateTime), 1);

          if (newProgress >= 1) {
            completed.push(file);

            // Check if we can add this file to uploads immediately
            const currentUploads = activeUploadsRef.current;

            // Calculate what the limit would be if we add this file
            const wouldHaveLargeFile = currentUploads.some(f => f.size > SMALL_FILE_THRESHOLD) ||
                                       file.size > SMALL_FILE_THRESHOLD;
            const effectiveMaxSlots = wouldHaveLargeFile ? MAX_CONCURRENT_LARGE : MAX_CONCURRENT_SMALL;

            if (currentUploads.length < effectiveMaxSlots) {
              setActiveUploads(uploads => {
                // Guard against duplicates (StrictMode protection)
                if (uploads.some(f => f.id === file.id)) {
                  return uploads;
                }

                const newFile = {
                  ...file,
                  uploadStartTime: Date.now()
                };
                const updatedUploads = [...uploads, newFile];
                const mode = updatedUploads.some(f => f.size > SMALL_FILE_THRESHOLD)
                  ? '🔴 LARGE mode'
                  : '🟢 SMALL mode';

                addToTimeline(
                  `✓ "${file.id}" initiate complete → upload started immediately [${updatedUploads.length}/${effectiveMaxSlots}] ${mode}`,
                  'phase2'
                );

                return updatedUploads;
              });
            } else {
              setUploadQueue(queue => {
                // Guard against duplicates (StrictMode protection)
                if (queue.some(f => f.id === file.id)) {
                  return queue;
                }

                addToTimeline(`✓ "${file.id}" initiate complete → queued for upload`, 'phase1');
                return [...queue, file];
              });
            }
          } else {
            remaining.push({ ...file, progress: newProgress });
          }
        });

        return remaining;
      });

      // Process upload queue - add files one at a time, recalculating limits
      setUploadQueue(prevQueue => {
        if (prevQueue.length === 0) return prevQueue;

        const currentActive = activeUploadsRef.current;

        // Add files one at a time, recalculating limit after each
        const toStart: FileItem[] = [];
        let tempActive = [...currentActive];

        for (const file of prevQueue) {
          // Recalculate limit considering files we're about to add
          const currentMax = tempActive.some(f => f.size > SMALL_FILE_THRESHOLD)
            ? MAX_CONCURRENT_LARGE
            : MAX_CONCURRENT_SMALL;

          if (tempActive.length >= currentMax) break;

          toStart.push(file);
          tempActive.push(file); // Simulate adding it
        }

        if (toStart.length === 0) return prevQueue;

        setActiveUploads(active => {
          // Filter out any files already in active uploads (StrictMode protection)
          const filesToAdd = toStart.filter(file => !active.some(a => a.id === file.id));

          if (filesToAdd.length === 0) {
            return active; // Nothing new to add
          }

          const newActive = filesToAdd.map(file => ({
            ...file,
            uploadStartTime: Date.now()
          }));

          const allFiles = [...active, ...newActive];
          const finalMax = allFiles.some(f => f.size > SMALL_FILE_THRESHOLD)
            ? MAX_CONCURRENT_LARGE
            : MAX_CONCURRENT_SMALL;
          const mode = allFiles.some(f => f.size > SMALL_FILE_THRESHOLD)
            ? '🔴 LARGE mode'
            : '🟢 SMALL mode';

          newActive.forEach(file => {
            addToTimeline(
              `🔵 "${file.id}" (${file.size}MB) - upload started [${allFiles.length}/${finalMax}] ${mode}`,
              'phase2'
            );
          });

          return allFiles;
        });

        return prevQueue.slice(toStart.length);
      });

      // Update active uploads progress
      setActiveUploads(active => {
        if (active.length === 0) return active;

        const completed: FileItem[] = [];
        const remaining: FileItem[] = [];

        active.forEach(file => {
          const newProgress = Math.min(file.uploadProgress + tickAmount * (1000 / file.uploadTime), 1);

          if (newProgress >= 1) {
            completed.push(file);
            addToTimeline(`✅ "${file.id}" upload completed`, 'complete');
          } else {
            remaining.push({ ...file, uploadProgress: newProgress });
          }
        });

        if (completed.length > 0) {
          setCompletedCount(prev => prev + completed.length);
        }

        return remaining;
      });
    }, 10);

    return () => clearInterval(interval);
  }, [speed, addToTimeline]);

  const reset = useCallback(() => {
    fileCounterRef.current = 1;
    setFileCounter(1);
    setActiveInitiates([]);
    setInitiateQueue([]);
    setActiveUploads([]);
    setUploadQueue([]);
    setCompletedCount(0);
    setTimeline([]);
    setSpeed(0);
    addToTimeline('🔄 System reset', 'complete');
  }, [addToTimeline]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-600 to-blue-900 p-6">
      <div className="max-w-7xl mx-auto bg-slate-800/95 rounded-2xl shadow-2xl p-8 border border-slate-700/50">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          🚀 Upload Coordinator Demo
          {speed > 0 && (
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full ml-3 animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
          )}
        </h1>
        <p className="text-center text-gray-400 mb-6 text-sm">
          Dynamic slot allocation • Randomized network timing (±30%) • Adaptive semaphore pattern
        </p>

        <SpeedControl speed={speed} onSpeedChange={setSpeed} />

        <Controls onAddFile={addFile} onReset={reset} />

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-xl p-6 bg-gray-700/30 border border-gray-600/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-100">Phase 1: Active Initiates</h2>
              <span className="px-3 py-1 text-white text-xs font-bold rounded-full bg-green-600 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                Max 10
              </span>
            </div>

            <SlotGrid
              slots={initiateSlots}
              activeFiles={activeInitiates}
              type="initiate"
            />

            <QueueDisplay
              queue={initiateQueue}
              title="Queued for Initiate"
            />
          </div>

          <div className="rounded-xl p-6 bg-gray-700/30 border border-gray-600/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-100">Phase 2: Active Uploads</h2>
              <span
                className={`px-3 py-1 text-white text-xs font-bold rounded-full ${
                  hasLargeFile
                    ? 'bg-red-600 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                    : 'bg-green-600 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                }`}
              >
                {hasLargeFile ? 'Large Mode (3)' : 'Small Mode (5)'}
              </span>
            </div>

            <SlotGrid
              slots={uploadSlots}
              activeFiles={activeUploads}
              type="upload"
              currentLimit={currentLimit}
            />

            <QueueDisplay
              queue={uploadQueue}
              title="Queued for Upload"
            />
          </div>
        </div>

        <Stats
          totalFiles={totalFiles}
          activeCount={activeCount}
          completedCount={completedCount}
          currentLimit={currentLimit}
          queueDepth={queueDepth}
          hasLargeFile={hasLargeFile}
        />

        <Timeline timeline={timeline} />
      </div>
    </div>
  );
}

export default App;
