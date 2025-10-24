import { type FileItem } from '../types';

type GatekeeperDisplayProps = {
  gatekeeperQueue: FileItem[];
  maxSlots: number;
  currentSlots: number;
};

export const GatekeeperDisplay = ({
  gatekeeperQueue,
  maxSlots,
  currentSlots,
}: GatekeeperDisplayProps) => {
  const isFull = currentSlots >= maxSlots;

  return (
    <div className="relative my-4">
      {/* Gatekeeper Bar */}
      <div className={`bg-gradient-to-r ${
        isFull
          ? 'from-red-900/40 via-orange-900/40 to-red-900/40'
          : 'from-green-900/40 via-emerald-900/40 to-green-900/40'
      } border-2 ${
        isFull ? 'border-red-500/50' : 'border-green-500/50'
      } rounded-lg p-4 transition-all duration-300`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{isFull ? '🚫' : '✅'}</span>
            <div>
              <h3 className="text-sm font-bold text-gray-100">
                Gatekeeper: <code className="text-cyan-400">acquireUploadSlot()</code>
              </h3>
              <p className="text-xs text-gray-400">
                Blocks triggers when bandwidth slots are full
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xs font-semibold ${
              isFull ? 'text-red-400' : 'text-green-400'
            }`}>
              {currentSlots}/{maxSlots} slots used
            </div>
            <div className={`text-xs ${
              isFull ? 'text-red-300' : 'text-gray-400'
            }`}>
              {isFull ? '🔒 BLOCKING' : '🔓 Passing through'}
            </div>
          </div>
        </div>

        {/* Files waiting in queue */}
        {gatekeeperQueue.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-600/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400 font-bold text-sm">
                ⏸️ {gatekeeperQueue.length} file{gatekeeperQueue.length !== 1 ? 's' : ''} waiting
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {gatekeeperQueue.map((file) => (
                <div
                  key={file.key}
                  className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-md text-xs font-semibold text-yellow-300 animate-pulse"
                >
                  {file.id} ({file.size}MB)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual flow indicator */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500">
          <span>↓ Triggers</span>
          <span className={isFull ? 'text-red-400' : 'text-green-400'}>
            {isFull ? '→ BLOCKED' : '→ PASS'}
          </span>
          <span>↓ Bandwidth</span>
        </div>
      </div>

      {/* Arrow indicators */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center">
          <div className="text-purple-500 text-2xl animate-bounce">↓</div>
        </div>
      </div>
      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center">
          <div className={`text-2xl animate-bounce ${
            isFull ? 'text-red-500' : 'text-green-500'
          }`}>
            ↓
          </div>
        </div>
      </div>
    </div>
  );
};
