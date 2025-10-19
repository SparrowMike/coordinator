type StatsProps = {
  totalFiles: number;
  activeCount: number;
  completedCount: number;
  currentLimit: number;
  queueDepth: number;
  hasLargeFile: boolean;
};

export function Stats({
  totalFiles,
  activeCount,
  completedCount,
  currentLimit,
  queueDepth,
  hasLargeFile
}: StatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="rounded-lg p-4 text-center shadow-md bg-gray-700/50 border border-gray-600/50">
        <div className="text-2xl font-bold text-cyan-400">{totalFiles}</div>
        <div className="text-xs text-gray-400 mt-1">Total Files</div>
      </div>
      <div className="rounded-lg p-4 text-center shadow-md bg-gray-700/50 border border-gray-600/50">
        <div className="text-2xl font-bold text-blue-500">{activeCount}</div>
        <div className="text-xs text-gray-400 mt-1">In Progress</div>
      </div>
      <div className="rounded-lg p-4 text-center shadow-md bg-gray-700/50 border border-gray-600/50">
        <div className="text-2xl font-bold text-green-500">{completedCount}</div>
        <div className="text-xs text-gray-400 mt-1">Completed</div>
      </div>
      <div className="rounded-lg p-4 text-center shadow-md bg-gray-700/50 border border-gray-600/50">
        <div className={`text-2xl font-bold ${hasLargeFile ? 'text-red-400' : 'text-green-500'}`}>
          {currentLimit}
        </div>
        <div className="text-xs text-gray-400 mt-1">Upload Limit</div>
      </div>
      <div className="rounded-lg p-4 text-center shadow-md bg-gray-700/50 border border-gray-600/50">
        <div className="text-2xl font-bold text-cyan-400">{queueDepth}</div>
        <div className="text-xs text-gray-400 mt-1">Queue Depth</div>
      </div>
    </div>
  );
}
