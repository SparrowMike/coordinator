import { type DemoMode } from '../types';

type ModeToggleProps = {
  mode: DemoMode;
  onModeChange: (mode: DemoMode) => void;
  disabled?: boolean;
};

export const ModeToggle = ({ mode, onModeChange, disabled }: ModeToggleProps) => {
  return (
    <div className="bg-gray-700/40 rounded-xl p-4 border border-gray-600/50 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-100">Demo Mode</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onModeChange('simulation')}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              mode === 'simulation'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            📊 Simulation
          </button>
          <button
            onClick={() => onModeChange('real')}
            disabled={disabled}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              mode === 'real'
                ? 'bg-green-600 text-white shadow-lg shadow-green-500/50'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            ⚡ Real
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-400">
        {mode === 'simulation' ? (
          <div className="flex items-start gap-2">
            <span className="text-blue-400 font-bold mt-0.5">📊</span>
            <div>
              <div className="font-semibold text-blue-300 mb-1">Simulation Mode</div>
              <div>
                Step-by-step visualization of the Generator + Dual Concurrency pattern.
                Watch files move through: Initiate → Trigger → Gatekeeper → Upload layers.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <span className="text-green-400 font-bold mt-0.5">⚡</span>
            <div>
              <div className="font-semibold text-green-300 mb-1">Real Mode</div>
              <div>
                Actually executes the refactored coordinator with real async operations.
                Uses <code className="bg-gray-800 px-1 rounded text-green-400">coordinateUploads()</code> from coordinator.ts.
                <span className="text-green-400 font-semibold ml-1">Proof it works!</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
