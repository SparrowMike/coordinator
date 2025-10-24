import { type FileItem, MAX_CONCURRENT_UPLOAD_TRIGGERS } from '../types';

type TriggerLayerProps = {
  uploadTriggers: FileItem[];
  triggerQueue: FileItem[];
};

export const TriggerLayer = ({ uploadTriggers, triggerQueue }: TriggerLayerProps) => {
  const slots = Array.from({ length: MAX_CONCURRENT_UPLOAD_TRIGGERS }, (_, i) => i);

  const getStateColor = (state?: FileItem['triggerState']) => {
    switch (state) {
      case 'started':
        return 'bg-blue-500 border-blue-400 shadow-blue-500/50';
      case 'waiting-at-gatekeeper':
        return 'bg-yellow-500 border-yellow-400 shadow-yellow-500/50 animate-pulse';
      case 'uploading':
        return 'bg-green-500 border-green-400 shadow-green-500/50';
      case 'completed':
        return 'bg-gray-500 border-gray-400';
      default:
        return 'bg-gray-700 border-gray-600';
    }
  };

  const getStateIcon = (state?: FileItem['triggerState']) => {
    switch (state) {
      case 'started':
        return '🔵';
      case 'waiting-at-gatekeeper':
        return '⏸️';
      case 'uploading':
        return '⬆️';
      case 'completed':
        return '✓';
      default:
        return '';
    }
  };

  return (
    <div className="bg-purple-900/20 border-2 border-purple-500/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔷</span>
          <h3 className="text-base font-bold text-purple-300">
            Outer Layer: Upload Triggers
          </h3>
        </div>
        <span className="px-3 py-1 text-white text-xs font-bold rounded-full bg-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.5)]">
          Max {MAX_CONCURRENT_UPLOAD_TRIGGERS}
        </span>
      </div>

      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-2">
        {slots.map((slotIndex) => {
          const file = uploadTriggers[slotIndex];
          const isOccupied = !!file;

          return (
            <div
              key={slotIndex}
              className={`relative aspect-square rounded-lg border-2 transition-all duration-300 ${
                isOccupied
                  ? `${getStateColor(file.triggerState)} shadow-lg`
                  : 'bg-gray-700/50 border-gray-600/30'
              }`}
            >
              {isOccupied && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                  <div className="text-lg">{getStateIcon(file.triggerState)}</div>
                  <div className="text-xs font-bold text-white text-center break-all">
                    {file.id}
                  </div>
                  <div className="text-[10px] text-white/80">
                    {file.size}MB
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded-sm"></span>
            <span>Started</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-500 rounded-sm"></span>
            <span>Waiting @ Gatekeeper</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
            <span>Uploading</span>
          </span>
        </div>
        <div className="text-purple-300 text-xs mt-2">
          💡 Up to 10 upload processes can START simultaneously (outer concurrency)
        </div>
      </div>

      {/* Trigger Queue - waiting for generator to yield */}
      {triggerQueue.length > 0 && (
        <div className="mt-4 pt-4 border-t border-purple-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-purple-300">
              ⏳ Waiting for Trigger Slot ({triggerQueue.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {triggerQueue.map((file) => (
              <div
                key={file.key}
                className="px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-md text-xs font-semibold text-purple-200"
              >
                {file.id}
                <span className="text-purple-400 ml-1">({file.size}MB)</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-purple-400 italic">
            Generator blocked - only yields 10 promises at a time (outer concurrency limit)
          </div>
        </div>
      )}
    </div>
  );
};
