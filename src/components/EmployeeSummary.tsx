'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api-client';
import { useAutoRefresh } from '@/contexts/AutoRefreshContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

interface EmpRow {
  employee_id: string;
  employee_name: string;
  asset_type: string;
  model: string | null;
  dispatched: number;
  received: number;
  pending: number;
  created_by?: string; // Added for potential search, adjust RPC if needed
}

interface EmployeeSummaryProps {
  currentUser: string;
}

const EmployeeSummary: React.FC<EmployeeSummaryProps> = ({ currentUser }) => {
  const [rows, setRows] = useState<EmpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { registerRefreshCallback, unregisterRefreshCallback } = useAutoRefresh();

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement employee_summary endpoint in backend
      // For now, return empty array
      const data: EmpRow[] = [];
      const error = null;

      if (error) {
        console.error('RPC Error:', error);
        setError(`Failed to fetch employee summary: ${error.message}. Ensure the RPC 'employee_summary' is correctly defined.`);
        setRows([]);
      } else {
        console.log('Employee Data:', data); // Debug log
        setRows(data || []);
        if (data && data.length === 0) {
          setError('No employee data found. Ensure orders have employee details and "Inward"/"Outward" types.');
        }
      }
    } catch (err: any) {
      console.error('Fetch Error:', err);
      setError(`An error occurred while fetching data: ${err.message}`);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [currentUser, fetchSummary]);

  // Register refresh callback for auto-refresh
  useEffect(() => {
    registerRefreshCallback('employee-summary', fetchSummary);
    return () => {
      unregisterRefreshCallback('employee-summary');
    };
  }, [registerRefreshCallback, unregisterRefreshCallback, fetchSummary]);

  const matchesSearch = (row: EmpRow) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return (
      row.employee_id.toLowerCase().includes(query) ||
      row.employee_name.toLowerCase().includes(query) ||
      row.asset_type.toLowerCase().includes(query) ||
      (row.model?.toLowerCase().includes(query) || false) ||
      (row.created_by?.toLowerCase().includes(query) || false)
    );
  };

  const filteredRows = rows.filter(matchesSearch);
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedData = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const downloadCSV = () => {
    const headers = ['Employee ID', 'Employee Name', 'Asset Type', 'Model', 'Dispatched', 'Received', 'Pending'];
    const csvContent = [
      headers.join(','),
      ...filteredRows.map(row => [
        row.employee_id,
        row.employee_name,
        row.asset_type,
        row.model || '',
        row.dispatched,
        row.received,
        row.pending,
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_summary.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="mx-auto animate-spin h-6 w-6" />
          <p className="mt-2">Loading employee summary…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Employee Summary</CardTitle>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Button size="sm" variant="outline" onClick={fetchSummary}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={downloadCSV}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {error && (
          <Alert variant="destructive" className="mx-6 mb-0">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Asset Type</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Dispatched</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right font-semibold">Pending</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        {error ? error : searchQuery ? 'No matching employee data found.' : 'No employee data found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((r) => (
                      <TableRow key={r.employee_id}>
                        <TableCell>{r.employee_id}</TableCell>
                        <TableCell>{r.employee_name}</TableCell>
                        <TableCell>{r.asset_type}</TableCell>
                        <TableCell>{r.model ?? '—'}</TableCell>
                        <TableCell className="text-right">{r.dispatched}</TableCell>
                        <TableCell className="text-right">{r.received}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            r.pending > 0 ? 'text-orange-600' : r.pending < 0 ? 'text-red-600' : ''
                          }`}
                        >
                          {r.pending}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
          {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length} employees
        </span>
        <div className="flex items-center gap-2">
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page on rows per page change
            }}
            className="border rounded-md px-2 py-1 text-sm h-9"
          >
            <option value={10}>10</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
              <Button
                key={i + 1}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            {totalPages > 5 && <span className="text-sm px-2">...</span>}
            {totalPages > 5 && (
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSummary;