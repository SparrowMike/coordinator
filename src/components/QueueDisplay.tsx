import { type FileItem, SMALL_FILE_THRESHOLD } from '../types';

type QueueDisplayProps = {
  queue: FileItem[];
  title: string;
};

export function QueueDisplay({ queue, title }: QueueDisplayProps) {
  return (
    <div className="rounded-lg p-3 bg-slate-800/50 border border-slate-700/50">
      <div className="text-sm font-semibold text-gray-300 mb-2">
        {title} ({queue.length})
      </div>
      <div className="flex flex-wrap gap-2" style={{ minHeight: '30px' }}>
        {queue.slice(0, 10).map(file => (
          <div
            key={file.key}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              file.size > SMALL_FILE_THRESHOLD
                ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                : 'bg-gray-600/50 border border-gray-500/50 text-gray-300'
            }`}
          >
            {file.id} ({file.size}MB)
          </div>
        ))}
        {queue.length > 10 && (
          <div className="px-3 py-1 text-xs text-gray-500">
            +{queue.length - 10} more
          </div>
        )}
      </div>
    </div>
  );
}
