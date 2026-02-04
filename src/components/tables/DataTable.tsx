import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import styles from './DataTable.module.css';

interface DataTableProps {
  data: Record<string, unknown>[];
  columns: {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
  }[];
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable({ data, columns }: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filteredData = useMemo(() => {
    if (!filter) return data;
    const lowerFilter = filter.toLowerCase();
    return data.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(lowerFilter)
      )
    );
  }, [data, filter]);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), 'ru', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const pagedData = useMemo(() => {
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск по таблице..."
            value={filter}
            onChange={e => { setFilter(e.target.value); setPage(0); }}
            className={styles.searchInput}
          />
        </div>
        <span className={styles.count}>
          Найдено: {sortedData.length} записей
        </span>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={col.sortable !== false ? styles.sortable : ''}
                >
                  <div className={styles.thContent}>
                    <span>{col.label}</span>
                    {col.sortable !== false && sortKey === col.key && (
                      sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.empty}>
                  Нет данных для отображения
                </td>
              </tr>
            ) : (
              pagedData.map((row, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col.key}>{String(row[col.key] ?? '')}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className={styles.pageButton}
          >
            Назад
          </button>
          <span className={styles.pageInfo}>
            Страница {page + 1} из {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className={styles.pageButton}
          >
            Вперёд
          </button>
        </div>
      )}
    </div>
  );
}
