'use client';

interface ManualCheckProgressProps {
  message: string;
  percent: number;
  details: { current: number; total: number; type: string } | null;
}

export function ManualCheckProgress({ message, percent, details }: ManualCheckProgressProps) {
  return (
    <div className="bg-surface rounded-lg shadow-md p-6 mb-8 border border-border">
      <h2 className="text-xl font-semibold text-text-primary mb-4">Processing...</h2>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-secondary">{message}</span>
          {details && (
            <span className="text-sm text-text-tertiary">{details.current} / {details.total} {details.type}</span>
          )}
        </div>
        <div className="w-full bg-surface-elevated rounded-full h-4 overflow-hidden">
          <div
            className="bg-accent-primary h-4 transition-all duration-300 ease-out flex items-center justify-center"
            style={{ width: `${percent}%` }}
          >
            {percent > 10 && <span className="text-xs font-medium text-white">{Math.round(percent)}%</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-text-tertiary">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-primary" />
        <span>Please wait while we check all clans...</span>
      </div>
    </div>
  );
}
