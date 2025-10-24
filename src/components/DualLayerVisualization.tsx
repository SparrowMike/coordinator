import { type FileItem, SMALL_FILE_THRESHOLD } from '../types';
import { TriggerLayer } from './TriggerLayer';
import { GatekeeperDisplay } from './GatekeeperDisplay';
import { SlotGrid } from './SlotGrid';

type DualLayerVisualizationProps = {
  uploadTriggers: FileItem[];
  triggerQueue: FileItem[];
  gatekeeperQueue: FileItem[];
  activeUploads: FileItem[];
  uploadSlots: number[];
  currentLimit: number;
  hasLargeFile: boolean;
};

export const DualLayerVisualization = ({
  uploadTriggers,
  triggerQueue,
  gatekeeperQueue,
  activeUploads,
  uploadSlots,
  currentLimit,
  hasLargeFile,
}: DualLayerVisualizationProps) => {
  return (
    <div className="rounded-xl p-6 bg-gray-700/30 border border-gray-600/50 mb-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-100 mb-1">
          Phase 2: Dual Concurrency Pattern
        </h2>
        <p className="text-sm text-gray-400">
          Generator pattern: Only <span className="text-purple-300 font-semibold">10 upload trigger promises</span> created at a time
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Flow: <span className="text-purple-300">10 triggers</span> →
          <span className="text-orange-300"> gatekeeper</span> →
          <span className="text-green-300"> {currentLimit} bandwidth slots</span>
        </p>
      </div>

      {/* Outer Layer: Upload Triggers */}
      <TriggerLayer uploadTriggers={uploadTriggers} triggerQueue={triggerQueue} />

      {/* Gatekeeper: acquireUploadSlot() */}
      <GatekeeperDisplay
        gatekeeperQueue={gatekeeperQueue}
        maxSlots={currentLimit}
        currentSlots={activeUploads.length}
      />

      {/* Inner Layer: Bandwidth Slots */}
      <div className="bg-green-900/20 border-2 border-green-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔷</span>
            <h3 className="text-base font-bold text-green-300">
              Inner Layer: Bandwidth Slots
            </h3>
          </div>
          <span
            className={`px-3 py-1 text-white text-xs font-bold rounded-full ${
              hasLargeFile
                ? 'bg-red-600 shadow-[0_0_20px_rgba(244,63,94,0.5)]'
                : 'bg-green-600 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
            }`}
          >
            {hasLargeFile ? `Large Mode (${currentLimit})` : `Small Mode (${currentLimit})`}
          </span>
        </div>

        <SlotGrid
          slots={uploadSlots}
          activeFiles={activeUploads}
          type="upload"
          currentLimit={currentLimit}
        />

        <div className="text-xs text-gray-400 mt-3">
          <div className="text-green-300">
            💡 Only {currentLimit} files consume actual bandwidth (inner concurrency)
          </div>
          <div className="mt-1 text-gray-500">
            Files {'>'}65MB: {activeUploads.filter(f => f.size > SMALL_FILE_THRESHOLD).length} large{' '}
            • {activeUploads.filter(f => f.size <= SMALL_FILE_THRESHOLD).length} small
          </div>
        </div>
      </div>

      {/* Pattern Explanation */}
      <div className="mt-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3">
        <div className="text-xs text-cyan-300 space-y-1">
          <div className="font-bold text-sm mb-1">🎯 Why Dual Concurrency?</div>
          <div>
            When a bandwidth slot frees, the next upload starts <strong>INSTANTLY</strong> because
            we already have upload processes started and waiting at the gatekeeper.
          </div>
          <div className="text-cyan-400 mt-2">
            ⚡ <strong>Result:</strong> Zero idle time = ~25% faster throughput!
          </div>
        </div>
      </div>
    </div>
  );
};
