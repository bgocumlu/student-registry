import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Calendar, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DataTable, Column } from '@/components/DataTable';
import type { Log, PaginatedResponse } from '@/types';
import { logsApi } from '@/services/api';
import { toast } from 'sonner';
import { useServerPagination } from '@/hooks/useServerPagination';
import { useAuth } from '@/contexts/AuthContext';

const getActionColor = (action: string) => {
  if (action.includes('DELETE')) return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
  if (action.includes('UPDATE') || action.includes('EDIT')) return 'bg-warning/10 text-warning hover:bg-warning/20';
  if (action.includes('ADD') || action.includes('CREATE')) return 'bg-success/10 text-success hover:bg-success/20';
  return 'bg-info/10 text-info hover:bg-info/20';
};

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};

export default function Logs() {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [paginationData, setPaginationData] = useState<PaginatedResponse<Log> | null>(null);
  
  const pagination = useServerPagination({ initialPage: 1, initialLimit: 10 });

  // This page should only be accessible to admins (route protection)
  // But add guard here too to prevent API calls if somehow accessed
  if (!isAdmin) {
    return <div className="text-center py-8 text-muted-foreground">Access denied. Admin only.</div>;
  }


  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const params: any = {
          ...pagination.paginationParams,
          page: pagination.paginationParams.page, // Backend expects 1-based pages
        };
        
        // Add filters
        if (activeSearchTerm) {
          params.action = activeSearchTerm;
        }
        if (dateFrom) {
          params.dateFrom = dateFrom.toISOString().split('T')[0];
        }
        if (dateTo) {
          params.dateTo = dateTo.toISOString().split('T')[0];
        }

        const response = await logsApi.getAll(params);
        setLogs(response.data || []);
        setPaginationData(response);
      } catch (error: any) {
        // Handle 403 specifically - user might need to re-login to get fresh token
        if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
          toast.error('Access denied. Your session may have expired or your permissions have changed. Please log out and log back in.');
          // Clear logs on 403
          setLogs([]);
          setPaginationData(null);
        } else {
          toast.error('Failed to load logs');
        }
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [pagination.paginationParams, activeSearchTerm, dateFrom, dateTo]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setActiveSearchTerm(searchTerm);
      pagination.setCurrentPage(1);
    }
  };

  const columns: Column<Log>[] = [
    { 
      key: 'timestamp', 
      header: 'Timestamp', 
      width: '180px',
      render: (log) => (
        <span className="font-mono text-sm">{formatTimestamp(log.timestamp)}</span>
      )
    },
    { 
      key: 'action', 
      header: 'Action', 
      width: '150px',
      render: (log) => (
        <Badge className={getActionColor(log.action)}>
          {log.action.replace(/_/g, ' ')}
        </Badge>
      )
    },
    { 
      key: 'email', 
      header: 'User Email', 
      width: '200px',
      render: (log) => log.user?.email || `User #${log.userId}`
    },
    { 
      key: 'details', 
      header: 'Details',
      render: (log) => (
        <span className="max-w-md truncate text-sm text-muted-foreground">
          {log.details}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Activity Logs</h2>
        <p className="text-muted-foreground">Track all system activities and changes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
          <CardDescription>
            {paginationData?.total || 0} log entr{(paginationData?.total || 0) !== 1 ? 'ies' : 'y'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
          ) : (
            <>
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by action or email... (Press Enter to search)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="pl-10"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateFrom}
                  onSelect={(date) => {
                    setDateFrom(date);
                    pagination.setCurrentPage(1);
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={dateTo}
                  onSelect={(date) => {
                    setDateTo(date);
                    pagination.setCurrentPage(1);
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="icon" onClick={() => { 
                setDateFrom(undefined); 
                setDateTo(undefined);
                pagination.setCurrentPage(1);
              }} title="Clear date filter">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <DataTable
            data={logs}
            columns={columns}
            keyExtractor={(log) => log.id.toString()}
            emptyMessage="No logs found"
            pagination={paginationData ? {
              enabled: true,
              currentPage: pagination.currentPage,
              totalPages: paginationData.totalPages || 1,
              onPageChange: pagination.setCurrentPage,
              getPageNumbers: pagination.getPageNumbers,
            } : undefined}
          />
          </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
