import {  SMALL_FILE_THRESHOLD, type FileItem } from '../types';

type SlotGridProps = {
  slots: number[];
  activeFiles: FileItem[];
  type: 'initiate' | 'upload';
  currentLimit?: number;
};

export function SlotGrid({ slots, activeFiles, type, currentLimit }: SlotGridProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {slots.map(i => {
        const file = activeFiles[i];
        const isDisabled = currentLimit !== undefined && i >= currentLimit;
        const isLarge = file?.size && file.size > SMALL_FILE_THRESHOLD;

        return (
          <div
            key={i}
            className={`w-20 h-20 border-2 rounded-xl flex flex-col items-center justify-center relative overflow-hidden transition-all ${
              file
                ? isLarge
                  ? 'border-red-400 bg-red-500/10 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                  : 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                : isDisabled
                ? 'border-gray-700 bg-slate-800/30 opacity-40'
                : 'border-gray-600 bg-slate-800/50'
            }`}
          >
            {file && (
              <>
                <span
                  className={`text-xs font-bold ${
                    isLarge ? 'text-red-300' : 'text-cyan-300'
                  }`}
                >
                  {file.id}
                </span>
                <span className="text-xs text-gray-400">{file.size}MB</span>
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 transition-transform origin-left"
                  style={{
                    background: isLarge
                      ? 'linear-gradient(to right, #ef4444, #ec4899)'
                      : 'linear-gradient(to right, #06b6d4, #3b82f6)',
                    transform: `scaleX(${type === 'initiate' ? file.progress : file.uploadProgress})`
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
