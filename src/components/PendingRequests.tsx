import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api-client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, X, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PendingRequest {
  id: string;
  request_type: "assign" | "return" | "change_location" | "change_status";
  asset_id: string;
  requested_by: string;
  requested_at: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  assign_to?: string;
  employee_id?: string;
  employee_email?: string;
  return_remarks?: string;
  return_location?: string;
  return_status?: string;
  asset_condition?: string;
  received_by?: string;
  configuration?: string;
  approved_by?: string;
  approved_at?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  original_assigned_to?: string;
  original_employee_id?: string;
  new_location?: string;
  new_status?: string;
  approver_comments?: string;
  rejection_reason?: string;
  assets?: {
    asset_id: string;
    name: string;
    type: string;
    brand: string;
    serial_number: string;
    configuration?: string;
    location: string;
    status: string;
    assigned_to?: string;
    employee_id?: string;
  };
}

const locations = [
  "Mumbai Office",
  "Hyderabad WH",
  "Ghaziabad WH",
  "Bhiwandi WH",
  "Patiala WH",
  "Bangalore Office",
  "Kolkata WH",
  "Trichy WH",
  "Gurugram Office",
  "Indore WH",
  "Bangalore WH",
  "Jaipur WH"
];

const allStatuses = ["Available", "Scrap/Damage", "Sale", "Lost", "Emp Damage", "Courier Damage"];

export const PendingRequests = ({ onRefresh }: { onRefresh?: () => void }) => {
  const { user } = useAuth() || { user: null };
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const [editedAssignTo, setEditedAssignTo] = useState("");
  const [editedEmployeeId, setEditedEmployeeId] = useState("");
  const [editedReturnLocation, setEditedReturnLocation] = useState("");
  const [editedReturnStatus, setEditedReturnStatus] = useState("");
  const [editedAssetCondition, setEditedAssetCondition] = useState("");
  const [editedRemarks, setEditedRemarks] = useState("");
  const [approverComments, setApproverComments] = useState("");

  // Fetch user role and requests on mount or user change
  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    fetchUserRole();
    fetchRequests();
  }, [user]);

  // Fetch user role from API
  const fetchUserRole = async () => {
    if (!user?.email) {
      setUserRole(null);
      return;
    }
    try {
      const response = await api.users.getMe();
      setUserRole(response.data?.role || null);
    } catch (error: any) {
      console.error('Error fetching user role:', error);
      toast.error('Failed to fetch user role');
    }
  };

  // Fetch pending requests from API
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.pendingRequests.getAll();
      // The API already handles filtering by user role on the backend
      setRequests((response.data || []) as PendingRequest[]);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast.error(`Failed to fetch requests: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle viewing request details
  const handleViewDetails = (request: PendingRequest) => {
    setSelectedRequest(request);
    setEditMode(false);
    setEditedAssignTo(request.assign_to || "");
    setEditedEmployeeId(request.employee_id || "");
    setEditedReturnLocation(request.return_location || request.new_location || "");
    setEditedReturnStatus(request.return_status || request.new_status || "");
    setEditedAssetCondition(request.asset_condition || "");
    setEditedRemarks(request.return_remarks || "");
    setApproverComments("");
    setShowDetailsDialog(true);
  };

  // Validate editable fields
  const validateInputs = () => {
    if (selectedRequest?.request_type === 'assign') {
      if (!editedAssignTo.trim() || !editedEmployeeId.trim()) {
        toast.error('Assign To and Employee ID are required for assignment');
        return false;
      }
    }
    if (selectedRequest?.request_type === 'return') {
      if (!editedReturnLocation.trim() || !editedReturnStatus.trim()) {
        toast.error('Return Location and Return Status are required for return');
        return false;
      }
    }
    if (selectedRequest?.request_type === 'change_location' && !editedReturnLocation.trim()) {
      toast.error('New Location is required for location change');
      return false;
    }
    if (selectedRequest?.request_type === 'change_status' && !editedReturnStatus.trim()) {
      toast.error('New Status is required for status change');
      return false;
    }
    return true;
  };

  // Handle request approval
  const handleApprove = async () => {
    if (!selectedRequest || !user?.email) {
      toast.error('No request selected or user not authenticated');
      return;
    }

    if (selectedRequest.status !== 'pending') {
      toast.error('Request already processed');
      return;
    }

    const isAdmin = userRole === 'Super Admin' || userRole === 'Admin';
    if (!isAdmin) {
      toast.error('Only Super Admin and Admin can approve requests');
      return;
    }

    if (editMode && !validateInputs()) {
      return;
    }

    setActionLoading(true);
    try {
      const originalAssignedTo = selectedRequest.assets?.assigned_to || null;
      const originalEmployeeId = selectedRequest.assets?.employee_id || null;

      // Update asset based on request type
      if (selectedRequest.request_type === 'assign') {
        await api.assets.update(selectedRequest.asset_id, {
          assigned_to: editMode ? editedAssignTo : selectedRequest.assign_to,
          employee_id: editMode ? editedEmployeeId : selectedRequest.employee_id,
          status: 'Assigned',
          assigned_date: new Date().toISOString(),
          updated_by: user.email,
          updated_at: new Date().toISOString(),
        });
      } else if (selectedRequest.request_type === 'return') {
        await api.assets.update(selectedRequest.asset_id, {
          status: editMode ? editedReturnStatus : selectedRequest.return_status || 'Available',
          assigned_to: null,
          employee_id: null,
          assigned_date: null,
          return_date: new Date().toISOString(),
          received_by: selectedRequest.received_by || user.email,
          location: editMode ? editedReturnLocation : selectedRequest.return_location,
          asset_condition: editMode ? editedAssetCondition : selectedRequest.asset_condition,
          remarks: editMode ? editedRemarks : selectedRequest.return_remarks,
          updated_by: user.email,
          updated_at: new Date().toISOString(),
        });
      } else if (selectedRequest.request_type === 'change_location') {
        await api.assets.update(selectedRequest.asset_id, {
          location: editMode ? editedReturnLocation : selectedRequest.new_location,
          updated_by: user.email,
          updated_at: new Date().toISOString(),
        });
      } else if (selectedRequest.request_type === 'change_status') {
        await api.assets.update(selectedRequest.asset_id, {
          status: editMode ? editedReturnStatus : selectedRequest.new_status,
          updated_by: user.email,
          updated_at: new Date().toISOString(),
        });
      }

      // Update request status
      await api.pendingRequests.update(selectedRequest.id, {
        status: 'approved',
        approved_by: user.email,
        approved_at: new Date().toISOString(),
        approver_comments: approverComments.trim() || null,
        original_assigned_to: selectedRequest.request_type === 'return' ? originalAssignedTo : null,
        original_employee_id: selectedRequest.request_type === 'return' ? originalEmployeeId : null,
      });

      toast.success('Request approved successfully');
      setShowDetailsDialog(false);
      fetchRequests();
      onRefresh?.();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(`Failed to approve request: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle request rejection
  const handleReject = async () => {
    if (!selectedRequest || !user?.email) {
      toast.error('No request selected or user not authenticated');
      return;
    }

    if (selectedRequest.status !== 'pending') {
      toast.error('Request already processed');
      return;
    }

    const isAdmin = userRole === 'Super Admin' || userRole === 'Admin';
    if (!isAdmin) {
      toast.error('Only Super Admin and Admin can reject requests');
      return;
    }

    setActionLoading(true);
    try {
      await api.pendingRequests.update(selectedRequest.id, {
        status: 'rejected',
        approved_by: user.email,
        approved_at: new Date().toISOString(),
        approver_comments: approverComments.trim() || null,
      });

      toast.success('Request rejected successfully');
      setShowDetailsDialog(false);
      fetchRequests();
      onRefresh?.();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(`Failed to reject request: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle request cancellation
  const handleCancel = async (request: PendingRequest) => {
    if (!user?.email) {
      toast.error('User not authenticated');
      return;
    }

    if (request.status !== 'pending') {
      toast.error('Cannot cancel processed request');
      return;
    }

    if (request.requested_by !== user.email) {
      toast.error('You can only cancel your own requests');
      return;
    }

    setActionLoading(true);
    try {
      await api.pendingRequests.update(request.id, {
        status: 'cancelled',
        cancelled_by: user.email,
        cancelled_at: new Date().toISOString(),
      });

      toast.success('Request cancelled successfully');
      fetchRequests();
      onRefresh?.();
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      toast.error(`Failed to cancel request: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Open approver comments in a new tab
  const openCommentInNewTab = (comment: string) => {
    if (!comment) return;
    const commentWindow = window.open("", "_blank");
    if (commentWindow) {
      commentWindow.document.write(`
        <html>
          <head>
            <title>Comment Details</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 24px; margin-bottom: 10px; }
              p { font-size: 16px; white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>Approver Comment</h1>
            <p>${comment.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </body>
        </html>
      `);
      commentWindow.document.close();
    } else {
      toast.error("Popup blocked. Please allow popups to view comments.");
    }
  };

  // Render loading state
  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading requests...</div>;
  }

  // Render empty state
  if (requests.length === 0) {
    return <div className="text-sm text-muted-foreground">No requests found.</div>;
  }

  const isAdmin = userRole === 'Super Admin' || userRole === 'Admin';

  // Filter and paginate requests
  const filteredRequests = requests
    .filter((request) => filterStatus === 'all' || request.status === filterStatus)
    .filter((request) => {
      const asset = request.assets;
      const searchLower = searchTerm.toLowerCase();
      return (
        request.assets?.asset_id.toLowerCase().includes(searchLower) ||
        (asset?.name || '').toLowerCase().includes(searchLower) ||
        (asset?.type || '').toLowerCase().includes(searchLower) ||
        (asset?.brand || '').toLowerCase().includes(searchLower) ||
        (asset?.serial_number || '').toLowerCase().includes(searchLower) ||
        (request.requested_by || '').toLowerCase().includes(searchLower) ||
        (request.assign_to || '').toLowerCase().includes(searchLower) ||
        (request.employee_id || '').toLowerCase().includes(searchLower) ||
        (asset?.assigned_to || '').toLowerCase().includes(searchLower) ||
        (asset?.employee_id || '').toLowerCase().includes(searchLower) ||
        (request.return_remarks || '').toLowerCase().includes(searchLower) ||
        (request.new_location || '').toLowerCase().includes(searchLower) ||
        (request.new_status || '').toLowerCase().includes(searchLower)
      );
    });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Requests
            <Badge variant="secondary">{filteredRequests.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-32"
              aria-label="Search requests"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32" aria-label="Filter by status">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {paginatedRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg" style={{ minHeight: '100px', maxHeight: '100px' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={request.request_type === 'assign' ? 'default' : 'secondary'}>
                      {request.request_type.toUpperCase()}
                    </Badge>
                    <span className="font-medium text-sm">{request.assets?.asset_id}</span>
                    <span className="text-sm text-muted-foreground">{request.assets?.name}</span>
                    <span className="text-sm text-muted-foreground">({request.assets?.serial_number || 'N/A'})</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Requested by: {request.requested_by} • {new Date(request.requested_at).toLocaleString()}
                  </div>
                  <div className="text-xs font-medium text-blue-600 mt-1">
                    {request.request_type === 'assign' ? (
                      <>Assign to: {request.assign_to} ({request.employee_id})</>
                    ) : request.request_type === 'return' ? (
                      <>Returning from: {request.original_assigned_to || request.assets?.assigned_to || 'N/A'} ({request.original_employee_id || request.assets?.employee_id || 'N/A'})</>
                    ) : request.request_type === 'change_location' ? (
                      <>New Location: {request.new_location || 'N/A'}</>
                    ) : request.request_type === 'change_status' ? (
                      <>New Status: {request.new_status || 'N/A'}</>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {request.approver_comments && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openCommentInNewTab(request.approver_comments)}
                      className="ml-2"
                      aria-label="View approver comments"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Comment
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleViewDetails(request)}
                    aria-label={`View details for request ${request.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Badge variant={
                    request.status === 'approved' ? 'default' :
                    request.status === 'rejected' ? 'destructive' :
                    request.status === 'pending' ? 'secondary' :
                    request.status === 'cancelled' ? 'outline' : 'secondary'
                  } className={request.status === 'approved' ? 'bg-green-500 text-white' : ''}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                  {request.status === 'pending' && request.requested_by === user?.email && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleCancel(request)}
                      disabled={actionLoading}
                      aria-label={`Cancel request ${request.id}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || actionLoading}
                aria-label="Previous page"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  onClick={() => handlePageChange(page)}
                  disabled={actionLoading}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || actionLoading}
                aria-label="Next page"
              >
                Next
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="request-details-description">
          <DialogHeader>
            <DialogTitle>
              Request Details - {selectedRequest?.request_type === 'assign' ? 'Assignment' : 
                                selectedRequest?.request_type === 'return' ? 'Return' : 
                                selectedRequest?.request_type === 'change_location' ? 'Location Change' : 
                                'Status Change'}
            </DialogTitle>
            <div id="request-details-description" className="sr-only">
              Detailed view of a pending request including asset details and approval options.
            </div>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Asset ID</Label>
                  <div className="text-sm font-medium">{selectedRequest.assets?.asset_id || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Asset Name</Label>
                  <div className="text-sm">{selectedRequest.assets?.name || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <div className="text-sm">{selectedRequest.assets?.type || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Brand</Label>
                  <div className="text-sm">{selectedRequest.assets?.brand || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Serial Number</Label>
                  <div className="text-sm">{selectedRequest.assets?.serial_number || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Current Status</Label>
                  <div className="text-sm">{selectedRequest.assets?.status || 'N/A'}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Configuration</Label>
                  <div className="text-sm">{selectedRequest.assets?.configuration || 'N/A'}</div>
                </div>
              </div>

              {selectedRequest.request_type === 'assign' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label>Assign To</Label>
                    {editMode && isAdmin ? (
                      <Input 
                        value={editedAssignTo} 
                        onChange={(e) => setEditedAssignTo(e.target.value)} 
                        aria-label="Assign to"
                      />
                    ) : (
                      <div className="text-sm font-medium">{selectedRequest.assign_to || 'N/A'}</div>
                    )}
                  </div>
                  <div>
                    <Label>Employee ID</Label>
                    {editMode && isAdmin ? (
                      <Input 
                        value={editedEmployeeId} 
                        onChange={(e) => setEditedEmployeeId(e.target.value)} 
                        aria-label="Employee ID"
                      />
                    ) : (
                      <div className="text-sm font-medium">{selectedRequest.employee_id || 'N/A'}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.request_type === 'return' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label>Return Location</Label>
                    {editMode && isAdmin ? (
                      <Select value={editedReturnLocation} onValueChange={setEditedReturnLocation}>
                        <SelectTrigger aria-label="Return location">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">{selectedRequest.return_location || 'N/A'}</div>
                    )}
                  </div>
                  <div>
                    <Label>Return Status</Label>
                    {editMode && isAdmin ? (
                      <Select value={editedReturnStatus} onValueChange={setEditedReturnStatus}>
                        <SelectTrigger aria-label="Return status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allStatuses.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">{selectedRequest.return_status || 'Available'}</div>
                    )}
                  </div>
                  <div>
                    <Label>Asset Condition</Label>
                    {editMode && isAdmin ? (
                      <Input 
                        value={editedAssetCondition} 
                        onChange={(e) => setEditedAssetCondition(e.target.value)} 
                        aria-label="Asset condition"
                      />
                    ) : (
                      <div className="text-sm">{selectedRequest.asset_condition || 'N/A'}</div>
                    )}
                  </div>
                  <div>
                    <Label>Employee ID</Label>
                    {editMode && isAdmin ? (
                      <Input 
                        value={editedEmployeeId} 
                        onChange={(e) => setEditedEmployeeId(e.target.value)} 
                        aria-label="Employee ID"
                      />
                    ) : (
                      <div className="text-sm">{selectedRequest.assets?.employee_id || 'N/A'}</div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label>Remarks</Label>
                    {editMode && isAdmin ? (
                      <Textarea 
                        value={editedRemarks} 
                        onChange={(e) => setEditedRemarks(e.target.value)} 
                        aria-label="Remarks"
                      />
                    ) : (
                      <div className="text-sm">{selectedRequest.return_remarks || 'N/A'}</div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Label>Returning From (Original)</Label>
                    <div className="text-sm">
                      {selectedRequest.original_assigned_to || selectedRequest.assets?.assigned_to || 'N/A'} ({selectedRequest.original_employee_id || selectedRequest.assets?.employee_id || 'N/A'})
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.request_type === 'change_location' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label>Current Location</Label>
                    <div className="text-sm">{selectedRequest.assets?.location || 'N/A'}</div>
                  </div>
                  <div>
                    <Label>New Location</Label>
                    {editMode && isAdmin ? (
                      <Select value={editedReturnLocation} onValueChange={setEditedReturnLocation}>
                        <SelectTrigger aria-label="New location">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">{selectedRequest.new_location || 'N/A'}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.request_type === 'change_status' && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label>Current Status</Label>
                    <div className="text-sm">{selectedRequest.assets?.status || 'N/A'}</div>
                  </div>
                  <div>
                    <Label>New Status</Label>
                    {editMode && isAdmin ? (
                      <Select value={editedReturnStatus} onValueChange={setEditedReturnStatus}>
                        <SelectTrigger aria-label="New status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allStatuses.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">{selectedRequest.new_status || 'N/A'}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Requested By</Label>
                  <div className="text-sm">{selectedRequest.requested_by}</div>
                  <Label className="text-xs text-muted-foreground mt-2">Requested At</Label>
                  <div className="text-sm">{new Date(selectedRequest.requested_at).toLocaleString()}</div>
                </div>

                {selectedRequest.status !== 'pending' && (
                  <>
                    {selectedRequest.status === 'cancelled' && selectedRequest.cancelled_at && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Cancelled By</Label>
                        <div className="text-sm">{selectedRequest.cancelled_by}</div>
                        <Label className="text-xs text-muted-foreground mt-2">Cancelled At</Label>
                        <div className="text-sm">{new Date(selectedRequest.cancelled_at).toLocaleString()}</div>
                      </div>
                    )}
                    {(selectedRequest.status === 'approved' || selectedRequest.status === 'rejected') && selectedRequest.approved_at && (
                      <div>
                        <Label className="text-xs text-muted-foreground">{selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'} By</Label>
                        <div className="text-sm">{selectedRequest.approved_by}</div>
                        <Label className="text-xs text-muted-foreground mt-2">{selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'} At</Label>
                        <div className="text-sm">{new Date(selectedRequest.approved_at).toLocaleString()}</div>
                        {selectedRequest.approver_comments && (
                          <>
                            <Label className="text-xs text-muted-foreground mt-2">Approver Comments</Label>
                            <div className="text-sm">{selectedRequest.approver_comments}</div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {isAdmin && selectedRequest.status === 'pending' && (
                <div className="pt-4 border-t space-y-4">
                  <div>
                    <Label>Approver Comments (Optional)</Label>
                    <Textarea 
                      value={approverComments} 
                      onChange={(e) => setApproverComments(e.target.value)} 
                      aria-label="Approver comments"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    {!editMode && (
                      <Button 
                        variant="outline" 
                        onClick={() => setEditMode(true)}
                        disabled={actionLoading}
                        aria-label="Edit before approval"
                      >
                        Edit Before Approval
                      </Button>
                    )}
                    {editMode && (
                      <Button 
                        variant="outline" 
                        onClick={() => setEditMode(false)}
                        disabled={actionLoading}
                        aria-label="Cancel edit"
                      >
                        Cancel Edit
                      </Button>
                    )}
                    <Button 
                      variant="destructive" 
                      onClick={handleReject}
                      disabled={actionLoading}
                      aria-label="Reject request"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button 
                      onClick={handleApprove}
                      disabled={actionLoading}
                      aria-label="Approve request"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};