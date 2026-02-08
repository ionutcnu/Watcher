'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

export interface BulkImportResults {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    tag: string;
    success: boolean;
    error?: string;
    clan_id?: number;
    name?: string;
  }>;
}

export function useBulkImport(onComplete?: () => void) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkImportResults | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setResults(null);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(worksheet, { header: 1 });

      const clanTags: string[] = [];
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (Array.isArray(row) && row[0]) {
          const value = String(row[0]).trim();
          if (value && !value.toLowerCase().match(/^(clan|tag|name|guild)s?$/)) {
            clanTags.push(value);
          }
        }
      }

      if (clanTags.length === 0) {
        alert('No valid clan names found in the Excel file. Please ensure clan names are in the first column.');
        return;
      }

      if (!confirm(`Found ${clanTags.length} clan names. Do you want to import them all?`)) return;

      const BATCH_SIZE = 40;
      const batches: string[][] = [];
      for (let i = 0; i < clanTags.length; i += BATCH_SIZE) {
        batches.push(clanTags.slice(i, i + BATCH_SIZE));
      }

      const allResults: BulkImportResults['results'] = [];
      let totalSuccessful = 0;
      let totalFailed = 0;

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];

        try {
          const response = await fetch('/api/bulk-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clanTags: batch })
          });

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            await response.text();
            alert(`Server error for batch ${batchIndex + 1}: ${response.status} - ${response.statusText}`);
            continue;
          }

          const result = await response.json();
          if (result.success) {
            allResults.push(...result.results);
            totalSuccessful += result.successful;
            totalFailed += result.failed;
          } else {
            alert(`Batch ${batchIndex + 1} failed: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          alert(`Batch ${batchIndex + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setResults({ total: clanTags.length, successful: totalSuccessful, failed: totalFailed, results: allResults });
      onComplete?.();
    } catch {
      alert('Failed to process Excel file. Please ensure it is a valid .xlsx or .xls file.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return {
    loading, results, fileInputRef,
    handleFileUpload,
    clearResults: () => setResults(null),
  };
}
