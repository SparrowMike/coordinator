type ControlsProps = {
  onAddFile: (size: number) => void;
  onReset: () => void;
};

export function Controls({ onAddFile, onReset }: ControlsProps) {
  return (
    <div className="flex gap-3 justify-center mb-8 flex-wrap">
      <button
        onClick={() => onAddFile(30)}
        className="px-6 py-2.5 text-white rounded-lg font-semibold transform hover:-translate-y-0.5 transition-all bg-gradient-to-r from-green-600 to-teal-500 border border-green-500/50 hover:shadow-[0_10px_25px_-5px_rgba(16,185,129,0.5)]"
      >
        Add Small File (30MB)
      </button>
      <button
        onClick={() => onAddFile(100)}
        className="px-6 py-2.5 text-white rounded-lg font-semibold transform hover:-translate-y-0.5 transition-all bg-gradient-to-r from-red-600 to-pink-600 border border-red-500/50 hover:shadow-[0_10px_25px_-5px_rgba(244,63,94,0.5)]"
      >
        Add Large File (100MB)
      </button>
      <button
        onClick={onReset}
        className="px-6 py-2.5 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-500 transform hover:-translate-y-0.5 transition-all border border-gray-500"
      >
        Reset
      </button>
    </div>
  );
}
