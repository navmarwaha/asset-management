import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api-client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, Download, Upload } from "lucide-react";
import Papa from 'papaparse';

interface Employee {
  employee_id: string;
  employee_name: string;
  email: string;
  role?: string;
  department?: string;
}

const EmployeeDetails = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployee, setNewEmployee] = useState<Employee>({
    employee_id: '',
    employee_name: '',
    email: '',
    role: '',
    department: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState<string | null>(null); // Added to track user role
  const rowsPerPage = 10;

  useEffect(() => {
    fetchEmployees();
    fetchUserRole(); // Fetch the user's role
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await api.users.getMe();
      setUserRole(response.data?.role || null);
    } catch (error) {
      console.error('Unexpected error fetching user role:', error);
      setUserRole(null);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.employees.getAll();
      setEmployees(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch employees');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!newEmployee.employee_id || !newEmployee.employee_name || !newEmployee.email) {
      toast.error('Employee ID, Name, and Email are required');
      return;
    }

    try {
      setLoading(true);
      let result;
      const employeeData = {
        employee_id: newEmployee.employee_id,
        employee_name: newEmployee.employee_name,
        email: newEmployee.email,
        role: newEmployee.role || null,
        department: newEmployee.department || null
      };
      
      if (editingId) {
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('employee_id', editingId);
        
        if (error) {
          toast.error('Failed to update employee');
          console.error('Update error:', error);
          return;
        }
        result = { success: true, message: 'Employee updated successfully' };
        setEditingId(null);
      } else {
        // Add new employee
        const { error } = await supabase
          .from('employees')
          .insert([employeeData]);
        
        if (error) {
          toast.error('Failed to add employee');
          console.error('Insert error:', error);
          return;
        }
        result = { success: true, message: 'Employee added successfully' };
      }
      
      toast.success(result.message);
      setNewEmployee({
        employee_id: '',
        employee_name: '',
        email: '',
        role: '',
        department: ''
      });
      await fetchEmployees();
    } catch (error) {
      toast.error('An error occurred');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (emp: Employee) => {
    setNewEmployee({
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      email: emp.email,
      role: emp.role || '',
      department: emp.department || ''
    });
    setEditingId(emp.employee_id);
  };

  const handleDelete = async (employee_id: string) => {
    if (userRole !== 'Super Admin') {
      toast.error('Only Super Admin can delete employee details');
      return;
    }

    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('employee_id', employee_id);
      
      if (error) {
        toast.error('Failed to delete employee');
        console.error('Delete error:', error);
        return;
      }
      
      toast.success('Employee deleted successfully');
      await fetchEmployees();
    } catch (error) {
      toast.error('An error occurred');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setNewEmployee({
      employee_id: '',
      employee_name: '',
      email: '',
      role: '',
      department: ''
    });
    setEditingId(null);
  };

  const filteredEmployees = employees.filter(emp => 
    Object.values(emp).some(value => 
      value?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleDownload = () => {
    const csv = Papa.unparse(employees.map(emp => ({
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      email: emp.email,
      role: emp.role || '',
      department: emp.department || ''
    })));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'employees.csv';
    link.click();
  };

  const handleTemplateDownload = () => {
    const template = [{
      employee_id: '',
      employee_name: '',
      email: '',
      role: '',
      department: ''
    }];
    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'employee_template.csv';
    link.click();
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as Employee[];
        if (!Array.isArray(data) || data.length === 0) {
          toast.error('No valid data found in the CSV file');
          return;
        }

        const validEmployees: Employee[] = [];
        const errors: string[] = [];

        data.forEach((emp, index) => {
          if (!emp.employee_id || !emp.employee_name || !emp.email) {
            errors.push(`Row ${index + 2}: Missing required fields (Employee ID, Name, or Email)`);
          } else {
            validEmployees.push({
              employee_id: emp.employee_id,
              employee_name: emp.employee_name,
              email: emp.email,
              role: emp.role || null,
              department: emp.department || null
            });
          }
        });

        if (validEmployees.length === 0) {
          toast.error('No valid employees to upload. Check the CSV format and try again.');
          return;
        }

        try {
          setLoading(true);
          const response = await api.employees.createBulk(validEmployees);
          if (response.errors > 0) {
            toast.warning(`Created ${response.created} employees, ${response.errors} errors occurred`);
          } else {
            toast.success(`Successfully created ${response.created} employees`);
          }

          if (error) {
            throw error;
          }

          toast.success(`Successfully uploaded ${validEmployees.length} employee(s)`);
          await fetchEmployees();
        } catch (error: any) {
          toast.error(`Failed to upload employees: ${error.message}`);
          console.error('Bulk upload error:', error);
          if (errors.length > 0) {
            toast.error(`Validation errors: ${errors.join('\n')}`);
          }
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        toast.error('Failed to parse CSV file. Please ensure it’s a valid CSV with the correct headers.');
        console.error('CSV parsing error:', error);
      },
    });
  };

  if (loading && employees.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading employees...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Employee Details
          <span className="text-sm text-muted-foreground">
            ({employees.length} employees)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add/Edit Form */}
        <div className="space-y-4 mb-6 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium">
            {editingId ? 'Edit Employee' : 'Add New Employee'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                value={newEmployee.employee_id}
                onChange={(e) => setNewEmployee({
                  ...newEmployee,
                  employee_id: e.target.value
                })}
                placeholder=""
                disabled={!!editingId}
              />
            </div>
            <div>
              <Label htmlFor="employeeName">Employee Name *</Label>
              <Input
                id="employeeName"
                value={newEmployee.employee_name}
                onChange={(e) => setNewEmployee({
                  ...newEmployee,
                  employee_name: e.target.value
                })}
                placeholder=""
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({
                  ...newEmployee,
                  email: e.target.value
                })}
                placeholder=""
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({
                  ...newEmployee,
                  role: e.target.value
                })}
                placeholder=""
              />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({
                  ...newEmployee,
                  department: e.target.value
                })}
                placeholder=""
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAddOrUpdate}
              disabled={loading || !newEmployee.employee_id || !newEmployee.employee_name || !newEmployee.email}
              className="flex-1"
            >
              {loading ? 'Processing...' : (editingId ? 'Update' : 'Add')} Employee
            </Button>
            {editingId && (
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTemplateDownload}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <label htmlFor="bulk-upload">
              <Button variant="outline" asChild>
                <div>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </div>
              </Button>
              <input
                id="bulk-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleBulkUpload}
              />
            </label>
          </div>
        </div>

        {/* Employees Table */}
        <div className="overflow-x-auto max-h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[150px]">Employee ID</TableHead>
                <TableHead className="w-[200px]">Employee Name</TableHead>
                <TableHead className="w-[250px]">Email</TableHead>
                <TableHead className="w-[150px]">Role</TableHead>
                <TableHead className="w-[150px]">Department</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-lg">📋</div>
                      <p>No employees found</p>
                      <p className="text-sm">Add your first employee above to get started.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((emp) => (
                  <TableRow key={emp.employee_id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{emp.employee_id}</TableCell>
                    <TableCell>{emp.employee_name}</TableCell>
                    <TableCell className="text-sm">{emp.email}</TableCell>
                    <TableCell>{emp.role || '-'}</TableCell>
                    <TableCell>{emp.department || '-'}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(emp)}
                        disabled={loading}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(emp.employee_id)}
                        disabled={loading || userRole !== 'Super Admin'} // Disable if not Super Admin
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {employees.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeDetails;