'use client';

import type { BulkImportResults } from '@/hooks/use-bulk-import';

interface BulkImportPanelProps {
  loading: boolean;
  results: BulkImportResults | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearResults: () => void;
}

export function BulkImportPanel({ loading, results, fileInputRef, onFileUpload, onClearResults }: BulkImportPanelProps) {
  return (
    <div className="bg-surface rounded-lg shadow-md p-6 border border-border">
      <h2 className="text-xl font-semibold mb-4 text-text-primary">Bulk Import from Excel</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-text-secondary mb-3">
            Upload an Excel file (.xlsx or .xls) with clan names or tags in the first column.
            The system will automatically search and add matching clans.
          </p>
          <div className="flex items-center gap-4">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={onFileUpload} disabled={loading}
              className="hidden" id="excel-upload" />
            <label htmlFor="excel-upload"
              className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${
                loading ? 'bg-surface-elevated text-text-tertiary cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
              }`}>
              {loading ? 'Processing...' : 'Choose Excel File'}
            </label>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500" />
                <span>Importing clans...</span>
              </div>
            )}
          </div>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-surface-elevated rounded-lg">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary">{results.total}</div>
                <div className="text-sm text-text-secondary">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{results.successful}</div>
                <div className="text-sm text-text-secondary">Successfully Added</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{results.failed}</div>
                <div className="text-sm text-text-secondary">Failed</div>
              </div>
            </div>

            {results.results.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-surface sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">Tag</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {results.results.map((result, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-text-primary font-medium">{result.tag}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            result.success ? 'bg-green-800 text-green-300' : 'bg-red-800 text-red-300'
                          }`}>
                            {result.success ? 'Added' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-text-secondary">
                          {result.success ? <span>[{result.tag}] {result.name}</span> : <span className="text-red-400">{result.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button onClick={onClearResults} className="mt-4 px-4 py-2 bg-surface text-text-primary rounded-md hover:bg-surface-elevated border border-border w-full">
              Close Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
