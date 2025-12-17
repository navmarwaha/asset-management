'use client';

import React, { useState } from 'react';
import api from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface EditOrderDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: Order) => void;
}

const EditOrderDialog: React.FC<EditOrderDialogProps> = ({
  order,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    sales_order: order.sales_order,
    quantity: order.quantity,
    employee_name: order.employee_name,
    employee_id: order.employee_id,
    warehouse: order.warehouse,
    model: order.model || '',
    serial_numbers: order.serial_numbers.join(', '),
  });

  const handleSubmit = async () => {
    const serials = form.serial_numbers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const { data, error } = await api.orders.update(order.id, {
      sales_order: form.sales_order,
      quantity: form.quantity,
      employee_name: form.employee_name,
      employee_id: form.employee_id,
      warehouse: form.warehouse,
      model: form.model || null,
      serial_numbers: serials,
      })
      .eq('id', order.id)
      .select()
      .single();

    if (error) {
      alert('Update failed: ' + error.message);
    } else {
      onSuccess(data);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Order – {order.sales_order}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sales_order" className="text-right">
              Sales Order
            </Label>
            <Input
              id="sales_order"
              value={form.sales_order}
              onChange={(e) => setForm({ ...form, sales_order: e.target.value })}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Qty
            </Label>
            <Input
              id="quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee_name" className="text-right">
              Employee
            </Label>
            <Input
              id="employee_name"
              value={form.employee_name}
              onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="employee_id" className="text-right">
              Emp ID
            </Label>
            <Input
              id="employee_id"
              value={form.employee_id}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="warehouse" className="text-right">
              Warehouse
            </Label>
            <Input
              id="warehouse"
              value={form.warehouse}
              onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model" className="text-right">
              Model
            </Label>
            <Input
              id="model"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="serials" className="text-right">
              Serials (comma)
            </Label>
            <Input
              id="serials"
              value={form.serial_numbers}
              onChange={(e) => setForm({ ...form, serial_numbers: e.target.value })}
              placeholder="SN1, SN2, SN3"
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderDialog;