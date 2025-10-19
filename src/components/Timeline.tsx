import { type TimelineEntry } from '../types';

type TimelineProps = {
  timeline: TimelineEntry[];
};

export function Timeline({ timeline }: TimelineProps) {
  return (
    <div className="rounded-xl p-4 overflow-y-auto bg-slate-900/50 border border-slate-700/50 max-h-64">
      <h3 className="font-bold text-gray-200 mb-3">Timeline</h3>
      <div className="space-y-1">
        {timeline.map(entry => (
          <div
            key={entry.id}
            className="px-3 py-2 rounded-lg text-xs bg-slate-800/80"
            style={{
              borderLeft: `4px solid ${
                entry.type === 'phase1'
                  ? '#22d3ee'
                  : entry.type === 'complete'
                  ? '#10b981'
                  : '#3b82f6'
              }`,
              color: '#d1d5db'
            }}
          >
            <span className="text-gray-500">[{entry.time}]</span> {entry.message}
          </div>
        ))}
      </div>
    </div>
  );
}
