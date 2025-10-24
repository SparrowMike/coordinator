import { useState, useCallback, useMemo } from 'react';
import {
  SMALL_FILE_THRESHOLD,
  MAX_CONCURRENT_SMALL,
  MAX_CONCURRENT_LARGE,
  MAX_CONCURRENT_INITIATES,
  MAX_CONCURRENT_UPLOAD_TRIGGERS,
  type FileItem,
  type TimelineEntry,
  type DemoMode,
} from './types';
import { resetCoordinator } from './coordinator';
import { SlotGrid } from './components/SlotGrid';
import { QueueDisplay } from './components/QueueDisplay';
import { Stats } from './components/Stats';
import { Timeline } from './components/Timeline';
import { Controls } from './components/Controls';
import { SpeedControl } from './components/SpeedControl';
import { ModeToggle } from './components/ModeToggle';
import { DualLayerVisualization } from './components/DualLayerVisualization';
import { useSimulationEngine } from './hooks/useSimulationEngine';
import { useFileManager } from './hooks/useFileManager';
import { useRealMode } from './hooks/useRealMode';

function App() {
  // Demo mode
  const [mode, setMode] = useState<DemoMode>('simulation');

  // Phase 1: Initiate state
  const [activeInitiates, setActiveInitiates] = useState<FileItem[]>([]);
  const [initiateQueue, setInitiateQueue] = useState<FileItem[]>([]);

  // Phase 2: Upload state (dual concurrency)
  const [activeTriggers, setActiveTriggers] = useState<FileItem[]>([]); // Max 10 (outer layer)
  const [triggerQueue, setTriggerQueue] = useState<FileItem[]>([]); // Waiting for trigger slot
  const [activeUploads, setActiveUploads] = useState<FileItem[]>([]); // 3-5 (inner layer)

  // UI state
  const [completedCount, setCompletedCount] = useState(0);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [speed, setSpeed] = useState(0);

  // Memoized slot arrays
  const initiateSlots = useMemo(
    () => Array.from({ length: MAX_CONCURRENT_INITIATES }, (_, i) => i),
    []
  );

  const uploadSlots = useMemo(
    () => Array.from({ length: MAX_CONCURRENT_SMALL }, (_, i) => i),
    []
  );

  // Derived state
  const hasLargeFile = activeUploads.some(f => f.size > SMALL_FILE_THRESHOLD);
  const currentLimit = hasLargeFile ? MAX_CONCURRENT_LARGE : MAX_CONCURRENT_SMALL;
  const queueDepth = initiateQueue.length + triggerQueue.length;
  const activeCount = activeInitiates.length + activeTriggers.length;

  // Visual trigger mapping - in simulation, just use activeTriggers directly
  const visualUploadTriggers = useMemo(() => {
    if (mode === 'simulation') {
      return activeTriggers;
    }
    // In real mode, we don't show triggers separately
    return [];
  }, [mode, activeTriggers]);

  // Timeline management
  const addToTimeline = useCallback((message: string, type: TimelineEntry['type'] = 'phase2') => {
    const time = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 1
    });

    setTimeline(prev => {
      // Prevent duplicates (StrictMode guard)
      const isDuplicate = prev.some(entry =>
        entry.message === message &&
        entry.type === type &&
        entry.time === time
      );

      if (isDuplicate) return prev;

      const newEntry: TimelineEntry = {
        id: `${Date.now()}-${Math.random()}`,
        time,
        message,
        type
      };
      return [newEntry, ...prev].slice(0, 100);
    });
  }, []);

  // File manager hook
  const { addFile, fileCounter, resetCounter } = useFileManager({
    activeInitiates,
    onUpdateInitiates: setActiveInitiates,
    onUpdateInitiateQueue: setInitiateQueue,
    onAddToTimeline: addToTimeline,
  });

  // Simulation engine hook
  useSimulationEngine({
    speed,
    activeInitiates,
    initiateQueue,
    activeTriggers,
    triggerQueue,
    activeUploads,
    onUpdateInitiates: setActiveInitiates,
    onUpdateInitiateQueue: setInitiateQueue,
    onUpdateTriggers: setActiveTriggers,
    onUpdateTriggerQueue: setTriggerQueue,
    onUpdateUploads: setActiveUploads,
    onAddToTimeline: addToTimeline,
    onIncrementCompleted: (count) => setCompletedCount(prev => prev + count),
  });

  // Real mode hook
  const { runReal, isRunningReal } = useRealMode({
    mode,
    activeInitiates,
    initiateQueue,
    uploadTriggers: activeTriggers,
    activeUploads,
    uploadQueue: triggerQueue,
    onAddToTimeline: addToTimeline,
  });

  // Reset function
  const reset = useCallback(() => {
    resetCounter();
    setActiveInitiates([]);
    setInitiateQueue([]);
    setActiveTriggers([]);
    setTriggerQueue([]);
    setActiveUploads([]);
    setCompletedCount(0);
    setTimeline([]);
    setSpeed(0);
    resetCoordinator();
    addToTimeline('🔄 System reset', 'complete');
  }, [addToTimeline, resetCounter]);

  // Calculate total files
  const totalFiles = fileCounter - 1;

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
          Generator Pattern + Dual Concurrency • Dynamic slot allocation • Adaptive bandwidth management
        </p>

        <ModeToggle mode={mode} onModeChange={setMode} disabled={speed > 0 || isRunningReal} />

        <div className="flex gap-4 flex-wrap align-middle mb-8 items-center justify-between">
          <Controls onAddFile={addFile} onReset={reset} />
          {mode === 'simulation' && <SpeedControl speed={speed} onSpeedChange={setSpeed} />}
        </div>

        {mode === 'real' && (
          <div className="mb-6">
            <button
              onClick={runReal}
              disabled={isRunningReal || speed > 0}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                isRunningReal || speed > 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-500/50'
              }`}
            >
              {isRunningReal ? '⏳ Running Real Upload...' : '⚡ Run Real Upload Coordination'}
            </button>
            <p className="text-xs text-center text-gray-400 mt-2">
              Executes <code className="text-cyan-400 bg-gray-800 px-1 rounded">coordinateUploads()</code> from coordinator.ts with real async operations
            </p>
          </div>
        )}

        {mode === 'simulation' ? (
          <>
            {/* Phase 1: Initiates */}
            <div className="rounded-xl p-6 bg-gray-700/30 border border-gray-600/50 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-100">Phase 1: Active Initiates</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Generator pattern: Only <span className="text-yellow-300 font-semibold">10 promises created</span> at a time
                  </p>
                </div>
                <span className="px-3 py-1 text-white text-xs font-bold rounded-full bg-yellow-600 shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                  Max {MAX_CONCURRENT_INITIATES}
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

              {initiateQueue.length > 0 && (
                <p className="text-xs text-yellow-400 italic mt-2 text-center">
                  💡 Generator only yields {MAX_CONCURRENT_INITIATES} initiate promises at a time (lazy evaluation)
                </p>
              )}
            </div>

            {/* Phase 2: Dual Layer Visualization */}
            <DualLayerVisualization
              uploadTriggers={visualUploadTriggers}
              triggerQueue={triggerQueue}
              gatekeeperQueue={activeTriggers.filter(t => t.triggerState === 'waiting-at-gatekeeper')}
              activeUploads={activeUploads}
              uploadSlots={uploadSlots}
              currentLimit={currentLimit}
              hasLargeFile={hasLargeFile}
            />
          </>
        ) : (
          <div className="rounded-xl p-6 bg-gray-700/30 border border-gray-600/50 mb-6">
            <h2 className="text-2xl font-bold text-gray-100 mb-4">Real Mode</h2>
            <p className="text-gray-400 mb-4">
              Add files using the controls above, then click "Run Real Upload Coordination" to
              execute the actual generator pattern with real async operations.
            </p>
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="text-sm text-green-300 space-y-2">
                <div>✓ Uses <code className="bg-gray-800 px-1 rounded">processConcurrently()</code> from coordinator.ts</div>
                <div>✓ Lazy promise creation with generators</div>
                <div>✓ Dual concurrency: 10 triggers → 3-5 bandwidth slots</div>
                <div>✓ Real async timing with acquireUploadSlot() gatekeeper</div>
              </div>
            </div>
          </div>
        )}

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
