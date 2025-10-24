type SpeedControlProps = {
  speed: number;
  onSpeedChange: (speed: number) => void;
};

export function SpeedControl({ speed, onSpeedChange }: SpeedControlProps) {
  return (
    <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50">
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm font-semibold text-gray-300">Speed:</span>
        <span className="text-sm text-gray-400">Paused</span>
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-64 h-2 rounded-lg appearance-none cursor-pointer bg-gray-600"
          style={{ accentColor: '#06b6d4' }}
        />
        <span className="text-sm text-gray-400">Fast (10x)</span>
        <span className="text-sm font-mono px-3 py-1 rounded-lg font-semibold inline-block w-20 text-center bg-slate-900 text-cyan-400 border border-gray-600">
          {speed === 0 ? 'Paused' : `${speed.toFixed(1)}x`}
        </span>
      </div>
    </div>
  );
}
