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
    <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-white">Bulk Import from Excel</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-300 mb-3">
            Upload an Excel file (.xlsx or .xls) with clan names or tags in the first column.
            The system will automatically search and add matching clans.
          </p>
          <div className="flex items-center gap-4">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={onFileUpload} disabled={loading}
              className="hidden" id="excel-upload" />
            <label htmlFor="excel-upload"
              className={`px-4 py-2 rounded-md cursor-pointer transition-colors ${
                loading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
              }`}>
              {loading ? 'Processing...' : 'Choose Excel File'}
            </label>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500" />
                <span>Importing clans...</span>
              </div>
            )}
          </div>
        </div>

        {results && (
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{results.total}</div>
                <div className="text-sm text-gray-400">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{results.successful}</div>
                <div className="text-sm text-gray-400">Successfully Added</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{results.failed}</div>
                <div className="text-sm text-gray-400">Failed</div>
              </div>
            </div>

            {results.results.length > 0 && (
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Tag</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-600">
                    {results.results.map((result, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-white font-medium">{result.tag}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            result.success ? 'bg-green-800 text-green-300' : 'bg-red-800 text-red-300'
                          }`}>
                            {result.success ? 'Added' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-300">
                          {result.success ? <span>[{result.tag}] {result.name}</span> : <span className="text-red-400">{result.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button onClick={onClearResults} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 w-full">
              Close Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
