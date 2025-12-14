import { useState, useCallback, useMemo } from 'react';

interface UseServerPaginationProps {
  initialPage?: number;
  initialLimit?: number;
}

interface UseServerPaginationReturn {
  currentPage: number;
  limit: number;
  setCurrentPage: (page: number) => void;
  setLimit: (limit: number) => void;
  getPageNumbers: (totalPages: number) => number[];
  paginationParams: { page: number; limit: number };
}

export function useServerPagination({ 
  initialPage = 1, 
  initialLimit = 10 
}: UseServerPaginationProps = {}): UseServerPaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const getPageNumbers = useCallback((totalPages: number) => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push(-2);
        pages.push(totalPages);
      }
    }
    
    return pages;
  }, [currentPage]);

  const handleSetCurrentPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleSetLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when limit changes
  }, []);

  // Memoize paginationParams to prevent infinite loops in useEffect dependencies
  const paginationParams = useMemo(() => ({ 
    page: currentPage, 
    limit 
  }), [currentPage, limit]);

  return {
    currentPage,
    limit,
    setCurrentPage: handleSetCurrentPage,
    setLimit: handleSetLimit,
    getPageNumbers,
    paginationParams,
  };
}
