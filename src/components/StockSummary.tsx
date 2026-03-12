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

interface StockRow {
  warehouse: string;
  asset_type: string;
  model: string | null;
  inward: number;
  outward: number;
  stock: number;
}

interface StockSummaryProps {
  currentUser: string;
}

const StockSummary: React.FC<StockSummaryProps> = ({ currentUser }) => {
  const [rows, setRows] = useState<StockRow[]>([]);
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
      // TODO: Implement stock_summary endpoint in backend
      // For now, return empty array
      const data: StockRow[] = [];
      const error = null;

      if (error) {
        console.error('RPC Error:', error);
        setError(`Failed to fetch stock summary: ${error.message}. Ensure the RPC 'stock_summary' is correctly defined.`);
        setRows([]);
      } else {
        console.log('Stock Data:', data); // Debug log
        setRows(data || []);
        if (data && data.length === 0) {
          setError('No stock data found. Ensure orders have "Inward"/"Outward" types.');
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
    registerRefreshCallback('stock-summary', fetchSummary);
    return () => {
      unregisterRefreshCallback('stock-summary');
    };
  }, [registerRefreshCallback, unregisterRefreshCallback, fetchSummary]);

  const matchesSearch = (row: StockRow) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return (
      row.warehouse.toLowerCase().includes(query) ||
      row.asset_type.toLowerCase().includes(query) ||
      (row.model?.toLowerCase().includes(query) || false)
    );
  };

  const filteredRows = rows.filter(matchesSearch);
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedData = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const downloadCSV = () => {
    const headers = ['Location', 'Asset Type', 'Model', 'Inward', 'Outward', 'Stock'];
    const csvContent = [
      headers.join(','),
      ...filteredRows.map(row => [
        row.warehouse,
        row.asset_type,
        row.model || '',
        row.inward,
        row.outward,
        row.stock,
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock_summary.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="mx-auto animate-spin h-6 w-6" />
          <p className="mt-2">Loading stock summary…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Stock Summary</CardTitle>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Input
                placeholder="Search stock..."
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
                    <TableHead>Location</TableHead>
                    <TableHead>Asset Type</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Inward</TableHead>
                    <TableHead className="text-right">Outward</TableHead>
                    <TableHead className="text-right font-semibold">Stock</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        {error ? error : searchQuery ? 'No matching stock data found.' : 'No stock data found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((r, i) => (
                      <TableRow key={`${r.warehouse}-${r.asset_type}-${r.model || 'null'}-${i}`}>
                        <TableCell>{r.warehouse}</TableCell>
                        <TableCell>{r.asset_type}</TableCell>
                        <TableCell>{r.model ?? '—'}</TableCell>
                        <TableCell className="text-right">{r.inward}</TableCell>
                        <TableCell className="text-right">{r.outward}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            r.stock > 0 ? 'text-green-600' : r.stock < 0 ? 'text-red-600' : ''
                          }`}
                        >
                          {r.stock}
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
          {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length} stock items
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

export default StockSummary;