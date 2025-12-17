'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api-client';
import { useAutoRefresh } from '@/contexts/AutoRefreshContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, Edit, Trash2, ChevronDown, ChevronUp, Download, Calendar } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditOrderDialog from "./EditOrderDialog";

interface Order {
  id: string;
  order_type: string;
  asset_type: string;
  model: string | null;
  quantity: number;
  warehouse: string;
  sales_order: string;
  employee_id: string;
  employee_name: string;
  serial_numbers: string[];
  order_date: string;
  created_by: string;
}

interface ViewOrdersProps {
  currentUser: string;
  userRole: string | null;
}

const ViewOrders: React.FC<ViewOrdersProps> = ({ currentUser, userRole }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedSerials, setExpandedSerials] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const toggleSerials = (orderId: string) => {
    setExpandedSerials(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const { registerRefreshCallback, unregisterRefreshCallback } = useAutoRefresh();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.orders.getAll();
      setOrders(response.data || []);
      setCurrentPage(1); // Reset to first page on new fetch
    } catch (err: any) {
      alert('Error loading orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [currentUser, fetchOrders]);

  // Register refresh callback for auto-refresh
  useEffect(() => {
    registerRefreshCallback('view-orders', fetchOrders);
    return () => {
      unregisterRefreshCallback('view-orders');
    };
  }, [registerRefreshCallback, unregisterRefreshCallback, fetchOrders]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.orders.delete(deleteId);
      setOrders((prevOrders) => {
        const filtered = prevOrders.filter(o => o.id !== deleteId);
        if (currentPage > Math.ceil(filtered.length / rowsPerPage)) {
          setCurrentPage((prevPage) => Math.max(1, prevPage - 1));
        }
        return filtered;
      });
    } catch (error: any) {
      alert('Failed to delete: ' + error.message);
    }
    setDeleteId(null);
  };

  const downloadCSV = () => {
    const headers = ['Sales Order', 'Order Type', 'Warehouse', 'Employee Name', 'Asset Type', 'Model', 'Quantity', 'Serial Numbers', 'Date', 'Created By'];
    const csvContent = [
      headers.join(','),
      ...filtered.map(o => [
        o.sales_order,
        o.order_type,
        o.warehouse,
        o.employee_name,
        o.asset_type,
        o.model || '',
        o.quantity,
        o.serial_numbers.join(';'),
        o.order_date,
        o.created_by,
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'orders.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const matchesSearch = (o: Order) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return (
      o.sales_order.toLowerCase().includes(query) ||
      o.asset_type.toLowerCase().includes(query) ||
      o.employee_name.toLowerCase().includes(query) ||
      (o.model && o.model.toLowerCase().includes(query)) ||
      o.warehouse.toLowerCase().includes(query) ||
      o.serial_numbers.some(s => s.toLowerCase().includes(query)) ||
      o.created_by.toLowerCase().includes(query)
    );
  };

  const matchesDate = (o: Order) => {
    const orderDate = new Date(o.order_date);
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    if (fromDate && orderDate < fromDate) return false;
    if (toDate && orderDate > toDate) return false;
    return true;
  };

  const filtered = orders.filter(o => matchesSearch(o) && matchesDate(o));
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="mx-auto animate-spin h-6 w-6" />
          <p className="mt-2">Loading your orders...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <CardTitle>Your Orders</CardTitle>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          {/* Date Filter */}
          <div className="flex gap-1">
            <div className="relative">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="relative">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          {/* Buttons */}
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={downloadCSV} variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sales Order</TableHead>
                    <TableHead>Order type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Asset Type</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Serial numbers</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                        {searchQuery || dateFrom || dateTo ? 'No matching orders.' : 'You have no orders yet.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((o) => {
                      const isExpanded = expandedSerials.has(o.id);
                      const visibleSerials = isExpanded ? o.serial_numbers : o.serial_numbers.slice(0, 2);
                      const hasMore = o.serial_numbers.length > 2;

                      return (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium text-blue-600">{o.sales_order}</TableCell>
                          <TableCell><Badge variant="outline">{o.order_type}</Badge></TableCell>
                          <TableCell>{o.warehouse}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{o.employee_name}</div>
                              <div className="text-xs text-muted-foreground">{o.employee_id}</div>
                            </div>
                          </TableCell>
                          <TableCell>{o.asset_type}</TableCell>
                          <TableCell>{o.model || '—'}</TableCell>
                          <TableCell className="text-center">{o.quantity}</TableCell>
                          <TableCell>
                            {o.serial_numbers.length === 0 ? (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            ) : (
                              <div className="flex flex-wrap items-center gap-1">
                                {visibleSerials.map((s, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                                ))}
                                {hasMore && !isExpanded && (
                                  <button onClick={() => toggleSerials(o.id)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                                    +{o.serial_numbers.length - 2} more <ChevronDown className="h-3 w-3" />
                                  </button>
                                )}
                                {isExpanded && (
                                  <button onClick={() => toggleSerials(o.id)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                                    Show less <ChevronUp className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{new Date(o.order_date).toLocaleDateString()}</TableCell>
                          <TableCell>{o.created_by}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button size="sm" variant="ghost" onClick={() => setEditOrder(o)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => setDeleteId(o.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
          Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} assets
        </span>
        <div className="flex items-center gap-2">
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page on rows per page change
            }}
            className="border rounded p-1 text-sm"
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
                disabled={currentPage === i + 1}
              >
                {i + 1}
              </Button>
            ))}
            {totalPages > 5 && <span className="text-sm">...</span>}
            {totalPages > 5 && (
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
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

      {editOrder && (
        <EditOrderDialog
          order={editOrder}
          open={!!editOrder}
          onOpenChange={(open) => !open && setEditOrder(null)}
          onSuccess={(updated) => {
            setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)));
            setEditOrder(null);
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The order and its serial numbers will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ViewOrders;