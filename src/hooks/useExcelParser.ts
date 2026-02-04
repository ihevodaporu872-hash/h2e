import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

export interface SheetData {
  name: string;
  data: Record<string, unknown>[];
  columns: string[];
}

export interface ExcelParseResult {
  fileName: string;
  sheets: SheetData[];
  totalRows: number;
}

export function useExcelParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExcelParseResult | null>(null);

  const parseFile = useCallback(async (file: File): Promise<ExcelParseResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const sheets: SheetData[] = [];
      let totalRows = 0;

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        const columns = jsonData.length > 0
          ? Object.keys(jsonData[0])
          : [];

        sheets.push({
          name: sheetName,
          data: jsonData,
          columns
        });

        totalRows += jsonData.length;
      }

      const parseResult: ExcelParseResult = {
        fileName: file.name,
        sheets,
        totalRows
      };

      setResult(parseResult);
      setIsLoading(false);
      return parseResult;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при чтении файла';
      setError(message);
      setIsLoading(false);
      return null;
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    parseFile,
    clearResult,
    isLoading,
    error,
    result
  };
}
