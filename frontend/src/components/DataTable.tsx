import { ReactNode, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TablePagination } from '@/components/TablePagination';
import { usePagination } from '@/hooks/usePagination';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T) => ReactNode;
  accessor?: keyof T | ((item: T) => ReactNode);
  visible?: boolean;
}

// Server-side pagination props
interface ServerPaginationProps {
  enabled: true;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  getPageNumbers: (totalPages: number) => number[];
}

// Client-side pagination props (default behavior)
interface ClientPaginationProps {
  enabled?: false;
  itemsPerPage?: number;
}

type PaginationProps = ServerPaginationProps | ClientPaginationProps;

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  pagination?: PaginationProps;
  /** @deprecated Use pagination prop instead */
  itemsPerPage?: number;
}

export function DataTable<T>({ 
  data, 
  columns, 
  keyExtractor,
  emptyMessage = 'No data found',
  pagination,
  itemsPerPage: legacyItemsPerPage = 10,
}: DataTableProps<T>) {
  // Determine if using server-side pagination
  const isServerPagination = pagination?.enabled === true;
  
  // Client-side pagination (for backward compatibility)
  const clientPagination = usePagination({
    items: data,
    itemsPerPage: (!isServerPagination && (pagination as ClientPaginationProps)?.itemsPerPage) || legacyItemsPerPage,
  });

  // Items to display - either all (server already paginated) or client-paginated
  const displayItems = isServerPagination ? data : clientPagination.paginatedItems;
  
  // Pagination state
  const currentPage = isServerPagination 
    ? (pagination as ServerPaginationProps).currentPage 
    : clientPagination.currentPage;
  const totalPages = isServerPagination 
    ? (pagination as ServerPaginationProps).totalPages 
    : clientPagination.totalPages;
  const onPageChange = isServerPagination 
    ? (pagination as ServerPaginationProps).onPageChange 
    : clientPagination.setCurrentPage;
  const getPageNumbers = isServerPagination 
    ? () => (pagination as ServerPaginationProps).getPageNumbers(totalPages)
    : clientPagination.getPageNumbers;

  // Filter out hidden columns
  const visibleColumns = useMemo(() => 
    columns.filter(col => col.visible !== false),
    [columns]
  );

  const getCellValue = (item: T, column: Column<T>): ReactNode => {
    if (column.render) {
      return column.render(item);
    }
    if (column.accessor) {
      if (typeof column.accessor === 'function') {
        return column.accessor(item);
      }
      return item[column.accessor] as ReactNode;
    }
    return null;
  };

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={`${getAlignmentClass(column.align)} ${!column.width ? 'whitespace-nowrap' : ''}`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayItems.map((item) => (
              <TableRow key={keyExtractor(item)}>
                {visibleColumns.map((column, index) => (
                  <TableCell 
                    key={column.key}
                    className={`${index === 0 ? 'font-medium' : ''} ${getAlignmentClass(column.align)} ${!column.width ? 'whitespace-nowrap' : ''}`}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {getCellValue(item, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          getPageNumbers={getPageNumbers}
        />
      )}
    </>
  );
}
