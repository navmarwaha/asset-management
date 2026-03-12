// CreateOrder.tsx (Updated - Removed 'Other' from mainAssetTypes, validation, and renderAssetFields)
import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Camera, Download, ChevronDown, ChevronUp } from 'lucide-react';
// Supabase removed - using API client instead
import api from '@/lib/api-client';
import {
  orderTypes,
  tabletModels,
  tvModels,
  configurations,
  tvConfigurations,
  products,
  sdCardSizes,
  coverModels,
  pendriveSizes,
  locations,
  assetStatuses,
  assetGroups,
  assetTypes,
  assetModels,
  additionalAssetTypes,
} from './constants';

interface AssetItem {
  id: string;
  assetType: string;
  model: string;
  configuration?: string;
  product?: string;
  sdCardSize?: string;
  profileId?: string;
  quantity: number;
  location: string;
  serialNumbers: string[];
  assetStatuses: string[];
  assetGroups: string[];
  asset_conditions: string[];
  farCodes: string[];
  hasSerials: boolean;
}

interface CreateOrderProps {
  currentUser: string;
  userRole: string | null;
}

const CreateOrder: React.FC<CreateOrderProps> = ({ currentUser, userRole }) => {
  const [orderType, setOrderType] = useState('Hardware');
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [salesOrder, setSalesOrder] = useState('');
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [assetErrors, setAssetErrors] = useState<Record<string, (string | null)[]>>({});
  const [showBulk, setShowBulk] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [showAdditional, setShowAdditional] = useState(false);

  // Role-based access control
  if (!['Super Admin', 'Admin', 'Operator'].includes(userRole || '')) {
    return <div>Access Denied: Insufficient permissions to create orders.</div>;
  }

  const toast = ({ title, description, variant }: { title: string; description: string; variant?: 'destructive' }) => {
    alert(`${title}: ${description}`);
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const generateSalesOrder = () => {
    const digits = Math.floor(1000 + Math.random() * 9000);
    const letters = Math.random().toString(36).substr(2, 2).toUpperCase();
    const finalDigits = Math.floor(10 + Math.random() * 90);
    return `${digits}${letters}${finalDigits}`;
  };

  const defaultHasSerials = (assetType: string) => {
    return ['Tablet', 'TV', 'Pendrive', 'Sim Router', 'Hybrid Router'].includes(assetType);
  };

  const hasModels = (assetType: string): boolean => {
    return assetModels[assetType] && assetModels[assetType].length > 0;
  };

  const addAsset = (assetType: string) => {
    const hasSerials = defaultHasSerials(assetType);
    const newAsset: AssetItem = {
      id: generateId(),
      assetType,
      model: '',
      configuration: '',
      product: '',
      sdCardSize: assetType === 'SD Card' ? '' : undefined,
      profileId: '',
      quantity: 1,
      location: '',
      serialNumbers: hasSerials ? [''] : [],
      assetStatuses: ['Fresh'],
      assetGroups: ['FA'],
      asset_conditions: [''],
      farCodes: [''],
      hasSerials,
    };
    setAssets([...assets, newAsset]);
  };

  const updateAsset = (id: string, field: keyof AssetItem, value: any) => {
    setAssets(assets.map(asset => {
      if (asset.id === id) {
        if (field === 'quantity' && typeof value === 'number') {
          const newQuantity = Math.max(1, value);
          const currentSerials = asset.serialNumbers || [];
          const currentStatuses = asset.assetStatuses || [];
          const currentGroups = asset.assetGroups || [];
          const currentConditions = asset.asset_conditions || [];
          const currentFarCodes = asset.farCodes || [];
          const newSerialNumbers = asset.hasSerials ? Array(newQuantity).fill('').map((_, i) => currentSerials[i] || '') : [];
          let newAssetStatuses;
          let newAssetGroups;
          let newAssetConditions;
          let newFarCodes;
          if (asset.hasSerials) {
            newAssetStatuses = Array(newQuantity).fill('Fresh').map((_, i) => currentStatuses[i] || 'Fresh');
            newAssetGroups = Array(newQuantity).fill('FA').map((_, i) => currentGroups[i] || 'FA');
            newAssetConditions = Array(newQuantity).fill('').map((_, i) => currentConditions[i] || '');
            newFarCodes = Array(newQuantity).fill('').map((_, i) => currentFarCodes[i] || '');
          } else {
            const uniformStatus = currentStatuses[0] || 'Fresh';
            const uniformGroup = currentGroups[0] || 'FA';
            const uniformCondition = currentConditions[0] || '';
            const uniformFar = currentFarCodes[0] || '';
            newAssetStatuses = Array(newQuantity).fill(uniformStatus);
            newAssetGroups = Array(newQuantity).fill(uniformGroup);
            newAssetConditions = Array(newQuantity).fill(uniformCondition);
            newFarCodes = Array(newQuantity).fill(uniformFar);
          }
          return {
            ...asset,
            quantity: newQuantity,
            serialNumbers: newSerialNumbers,
            assetStatuses: newAssetStatuses,
            assetGroups: newAssetGroups,
            asset_conditions: newAssetConditions,
            farCodes: newFarCodes,
          };
        }
        if (field === 'hasSerials') {
          const newHasSerials = value;
          let newSerialNumbers = asset.serialNumbers;
          let newFarCodes = asset.farCodes;
          if (newHasSerials && newSerialNumbers.length === 0) {
            newSerialNumbers = Array(asset.quantity).fill('');
            newFarCodes = Array(asset.quantity).fill('');
          } else if (!newHasSerials) {
            newSerialNumbers = [];
            const uniformFar = asset.farCodes[0] || '';
            newFarCodes = Array(asset.quantity).fill(uniformFar);
          }
          if (!newHasSerials) {
            const uniformStatuses = Array(asset.quantity).fill(asset.assetStatuses[0] || 'Fresh');
            const uniformGroups = Array(asset.quantity).fill(asset.assetGroups[0] || 'FA');
            const uniformConditions = Array(asset.quantity).fill(asset.asset_conditions[0] || '');
            return {
              ...asset,
              hasSerials: newHasSerials,
              serialNumbers: newSerialNumbers,
              assetStatuses: uniformStatuses,
              assetGroups: uniformGroups,
              asset_conditions: uniformConditions,
              farCodes: newFarCodes,
            };
          } else {
            return {
              ...asset,
              hasSerials: newHasSerials,
              serialNumbers: newSerialNumbers,
              farCodes: newFarCodes,
            };
          }
        }
        if (field === 'model' && asset.assetType === 'SD Card') {
          return { ...asset, [field]: value, sdCardSize: value };
        }
        if (field === 'serialNumbers') {
          return { ...asset, [field]: value };
        }
        return { ...asset, [field]: value };
      }
      return asset;
    }));
  };

  const removeAsset = (id: string) => setAssets(assets.filter(asset => asset.id !== id));

  const fetchAssetDetails = async (asset: AssetItem, index: number, serialNumber: string) => {
    if (!serialNumber || !asset.hasSerials) return;
    // TODO: Implement device lookup in backend API if needed
    // For now, use default values
    const deviceData: any[] = [];
    const deviceError = null;
    if (deviceError || !deviceData || deviceData.length === 0) {
      setAssets(prevAssets =>
        prevAssets.map(a => {
          if (a.id === asset.id) {
            const newStatuses = [...a.assetStatuses];
            const newGroups = [...a.assetGroups];
            const newFarCodes = [...a.farCodes];
            newStatuses[index] = 'Fresh';
            newGroups[index] = 'FA';
            newFarCodes[index] = '';
            return {
              ...a,
              assetStatuses: newStatuses,
              assetGroups: newGroups,
              farCodes: newFarCodes,
            };
          }
          return a;
        })
      );
      return;
    }
    const device = deviceData[0];
    setAssets(prevAssets =>
      prevAssets.map(a => {
        if (a.id === asset.id) {
          const newStatuses = [...a.assetStatuses];
          const newGroups = [...a.assetGroups];
          const newFarCodes = [...a.farCodes];
          newStatuses[index] = device.asset_status || 'Fresh';
          newGroups[index] = device.asset_group || 'FA';
          newFarCodes[index] = device.far_code || '';
          return {
            ...a,
            assetStatuses: newStatuses,
            assetGroups: newGroups,
            farCodes: newFarCodes,
          };
        }
        return a;
      })
    );
  };

  const validateSerials = async () => {
    const errors: Record<string, (string | null)[]> = {};
    const isInward = ['Stock', 'Return'].includes(orderType);
    for (const asset of assets) {
      if (!asset.hasSerials) {
        errors[asset.id] = Array(asset.quantity).fill(null);
        continue;
      }
      const serialErrors: (string | null)[] = Array(asset.quantity).fill(null);
      const allSerials = asset.serialNumbers.filter(sn => sn && sn.trim());
      for (let i = 0; i < asset.serialNumbers.length; i++) {
        const serial = asset.serialNumbers[i]?.trim();
        if (serial && allSerials.filter(s => s === serial).length > 1) {
          serialErrors[i] = 'Duplicate within order';
        }
      }
      if (allSerials.length > 0) {
        // TODO: Implement device validation in backend API if needed
        // For now, skip validation - deviceData will be empty
        const deviceData: any[] = [];
        const deviceError = null;
        
        // Skip device validation for now since devices table may not exist
        // if (deviceError) {
        //   console.error('Device fetch error:', deviceError.message);
        //   errors[asset.id] = serialErrors;
        //   continue;
        // }
        
        // TODO: Implement device validation in backend API
        // Device validation is currently disabled as the devices table may not exist
        // const latestBySerial: Record<string, any> = {};
        // deviceData?.forEach((device: any) => {
        //   if (!latestBySerial[device.serial_number] || new Date(device.updated_at) > new Date(latestBySerial[device.serial_number].updated_at)) {
        //     latestBySerial[device.serial_number] = device;
        //   }
        // });
        
        // Skip device validation for now
        // for (let i = 0; i < asset.serialNumbers.length; i++) {
        //   const serial = asset.serialNumbers[i]?.trim();
        //   if (!serial) {
        //     continue;
        //   }
        //   const latestDevice = latestBySerial[serial];
        //   if (latestDevice) {
        //     if (isInward && latestDevice.material_type === 'Inward' && latestDevice.warehouse !== asset.location) {
        //       serialErrors[i] = `Currently Inward in ${latestDevice.warehouse}`;
        //     } else if (!isInward && latestDevice.material_type === 'Outward' && latestDevice.warehouse !== asset.location) {
        //       serialErrors[i] = `Currently Outward in ${latestDevice.warehouse}`;
        //     } else if (!isInward && latestDevice.material_type === 'Inward' && latestDevice.warehouse !== asset.location) {
        //       serialErrors[i] = `Currently Inward in ${latestDevice.warehouse}`;
        //     }
        //   } else {
        //     if (!isInward) {
        //       serialErrors[i] = 'Not in stock';
        //     }
        //   }
        // }
      }
      errors[asset.id] = serialErrors;
    }
    setAssetErrors(errors);
  };

  useEffect(() => {
    validateSerials();
  }, [assets, orderType]);

  const handleSerialChange = async (asset: AssetItem, index: number, serial: string) => {
    if (!asset.hasSerials) return;
    const newSerials = [...asset.serialNumbers];
    newSerials[index] = serial;
    updateAsset(asset.id, 'serialNumbers', newSerials);
    await fetchAssetDetails(asset, index, serial.trim());
  };

  const openScanner = (itemId: string, index: number, assetType: string) => {
    console.log(`Opening scanner for ${assetType} at index ${index}`);
  };

  const validateForm = () => {
    if (!orderType) {
      toast({ title: 'Error', description: 'Please select an order type', variant: 'destructive' });
      return false;
    }
    if (!employeeId.trim()) {
      toast({ title: 'Error', description: 'Employee ID is required', variant: 'destructive' });
      return false;
    }
    if (!employeeName.trim()) {
      toast({ title: 'Error', description: 'Employee Name is required', variant: 'destructive' });
      return false;
    }
    if (assets.length === 0) {
      toast({ title: 'Error', description: 'Please add at least one asset', variant: 'destructive' });
      return false;
    }
    const isInward = ['Stock', 'Return'].includes(orderType);
    for (const asset of assets) {
      if (!asset.location) {
        toast({ title: 'Error', description: `Location is required for ${asset.assetType}`, variant: 'destructive' });
        return false;
      }
      // Updated: Model required for main types or if hasModels for additional
      if (assetTypes.includes(asset.assetType as any) && !asset.model) {
        toast({ title: 'Error', description: `Model is required for ${asset.assetType}`, variant: 'destructive' });
        return false;
      }
      if (additionalAssetTypes.includes(asset.assetType) && hasModels(asset.assetType) && !asset.model) {
        toast({ title: 'Error', description: `Model is required for ${asset.assetType}`, variant: 'destructive' });
        return false;
      }
      if (asset.assetStatuses.length !== asset.quantity || asset.assetGroups.length !== asset.quantity ||
          asset.asset_conditions.length !== asset.quantity || asset.farCodes.length !== asset.quantity) {
        toast({ title: 'Error', description: `Field count mismatch for ${asset.assetType}`, variant: 'destructive' });
        return false;
      }
      for (let i = 0; i < asset.quantity; i++) {
        if (isInward && asset.assetStatuses[i] === 'Scrap' && !asset.asset_conditions[i]?.trim()) {
          toast({ title: 'Error', description: `Asset condition is required for scrapped item in ${asset.assetType} at position ${i + 1}`, variant: 'destructive' });
          return false;
        }
      }
    }
    return true;
  };

  const logHistory = async (tableName: string, recordId: string, fieldName: string, newData: string, userEmail: string, salesOrder: string | null) => {
    // TODO: Implement history logging in backend API if needed
    // History logging is currently disabled as the history table may not exist
    // await api.history.create({
    //   record_id: recordId,
    //   sales_order: salesOrder,
    //   table_name: tableName,
    //   field_name: fieldName,
    //   old_data: '',
    //   new_data: newData,
    //   operation: 'INSERT',
    //   updated_by: userEmail,
    // });
  };

  const createOrder = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const materialType = ['Stock', 'Return'].includes(orderType) ? 'Inward' : 'Outward';
      for (const asset of assets) {
        const salesOrderId = salesOrder || generateSalesOrder();
        const assetSerials = asset.hasSerials ? asset.serialNumbers.filter(sn => sn && sn.trim()) : [];
        const orderData = await api.orders.create({
          order_type: orderType,
          material_type: materialType,
          asset_type: asset.assetType,
          model: asset.model,
          quantity: asset.quantity,
          warehouse: asset.location,
          sales_order: salesOrderId,
          employee_id: employeeId,
          employee_name: employeeName,
          serial_numbers: assetSerials,
          order_date: new Date().toISOString(),
          configuration: asset.configuration || null,
          product: asset.product || 'Lead',
          sd_card_size: asset.assetType === 'SD Card' ? asset.model : asset.sdCardSize || null,
          profile_id: asset.profileId || null,
          created_by: currentUser,
        });
        // TODO: Implement device creation in backend API if needed
        // The 'devices' table was part of the old Supabase schema
        // For now, device insertion is skipped as it may not be needed in the new schema
        // If device tracking is required, implement it in the backend API
        for (let i = 0; i < asset.quantity; i++) {
          // Device insertion removed - see TODO above
        }
        await logHistory('orders', orderData.id, 'order_type', orderType, currentUser, salesOrderId);
      }
      toast({ title: 'Success', description: 'Orders created successfully' });
      setAssets([]);
      setEmployeeId('');
      setEmployeeName('');
      setSalesOrder('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const renderAssetFields = (asset: AssetItem) => {
    const isMandatorySerial = ['Tablet', 'TV'].includes(asset.assetType);
    const showSerialSection = isMandatorySerial || asset.hasSerials;
    const isInward = ['Stock', 'Return'].includes(orderType);
    return (
      <div key={asset.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#f9fafb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>{asset.assetType}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {!isMandatorySerial && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <label style={{ fontSize: '12px' }}>Enable Serial Numbers</label>
                <input
                  type="checkbox"
                  checked={asset.hasSerials}
                  onChange={(e) => updateAsset(asset.id, 'hasSerials', e.target.checked)}
                />
              </div>
            )}
            <button onClick={() => removeAsset(asset.id)} style={{ color: '#ef4444' }}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {asset.assetType === 'Tablet' && (
            <>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Model *</label>
                <select
                  value={asset.model}
                  onChange={(e) => updateAsset(asset.id, 'model', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Model</option>
                  {tabletModels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Configuration</label>
                <select
                  value={asset.configuration || ''}
                  onChange={(e) => updateAsset(asset.id, 'configuration', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Configuration</option>
                  {configurations.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Product</label>
                <select
                  value={asset.product || ''}
                  onChange={(e) => updateAsset(asset.id, 'product', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>SD Card Size</label>
                <select
                  value={asset.sdCardSize || ''}
                  onChange={(e) => updateAsset(asset.id, 'sdCardSize', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Size</option>
                  {sdCardSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Profile ID</label>
                <input
                  type="text"
                  value={asset.profileId || ''}
                  onChange={(e) => updateAsset(asset.id, 'profileId', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                />
              </div>
            </>
          )}
          {asset.assetType === 'TV' && (
            <>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Model *</label>
                <select
                  value={asset.model}
                  onChange={(e) => updateAsset(asset.id, 'model', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Model</option>
                  {tvModels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Configuration</label>
                <select
                  value={asset.configuration || ''}
                  onChange={(e) => updateAsset(asset.id, 'configuration', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Configuration</option>
                  {tvConfigurations.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Product</label>
                <select
                  value={asset.product || ''}
                  onChange={(e) => updateAsset(asset.id, 'product', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}
          {asset.assetType === 'SD Card' && (
            <>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Model *</label>
                <select
                  value={asset.model}
                  onChange={(e) => updateAsset(asset.id, 'model', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Model</option>
                  {sdCardSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Profile ID</label>
                <input
                  type="text"
                  value={asset.profileId || ''}
                  onChange={(e) => updateAsset(asset.id, 'profileId', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Product</label>
                <select
                  value={asset.product || ''}
                  onChange={(e) => updateAsset(asset.id, 'product', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}
          {asset.assetType === 'Cover' && (
            <>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Model *</label>
                <select
                  value={asset.model}
                  onChange={(e) => updateAsset(asset.id, 'model', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Model</option>
                  {coverModels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Product</label>
                <select
                  value={asset.product || ''}
                  onChange={(e) => updateAsset(asset.id, 'product', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}
          {asset.assetType === 'Pendrive' && (
            <>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Model *</label>
                <select
                  value={asset.model}
                  onChange={(e) => updateAsset(asset.id, 'model', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Model</option>
                  {pendriveSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Product</label>
                <select
                  value={asset.product || ''}
                  onChange={(e) => updateAsset(asset.id, 'product', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}
          {/* Updated: Dynamic handling for additional asset types (no 'Other' block) */}
          {additionalAssetTypes.includes(asset.assetType) && (
            <>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Model *</label>
                <select
                  value={asset.model}
                  onChange={(e) => updateAsset(asset.id, 'model', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Model</option>
                  {hasModels(asset.assetType) ? assetModels[asset.assetType].map(m => <option key={m} value={m}>{m}</option>) : null}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Product</label>
                <select
                  value={asset.product || ''}
                  onChange={(e) => updateAsset(asset.id, 'product', e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                >
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Location *</label>
            <select
              value={asset.location}
              onChange={(e) => updateAsset(asset.id, 'location', e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            >
              <option value="">Select Location</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Quantity *</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => updateAsset(asset.id, 'quantity', Math.max(1, asset.quantity - 1))} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={asset.quantity}
                onChange={(e) => updateAsset(asset.id, 'quantity', parseInt(e.target.value) || 1)}
                style={{ width: '60px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'center', fontSize: '14px' }}
              />
              <button onClick={() => updateAsset(asset.id, 'quantity', asset.quantity + 1)} style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                <Plus size={16} />
              </button>
            </div>
          </div>
          {!showSerialSection && (
            <>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Asset Status</label>
                {isInward ? (
                  <select
                    value={asset.assetStatuses[0] || 'Fresh'}
                    onChange={(e) => {
                      const newStatuses = Array(asset.quantity).fill(e.target.value);
                      updateAsset(asset.id, 'assetStatuses', newStatuses);
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                  >
                    {assetStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={asset.assetStatuses[0] || 'Fresh'}
                    disabled
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', background: '#f3f4f6' }}
                  />
                )}
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Asset Group</label>
                {isInward ? (
                  <select
                    value={asset.assetGroups[0] || 'FA'}
                    onChange={(e) => {
                      const newGroups = Array(asset.quantity).fill(e.target.value);
                      updateAsset(asset.id, 'assetGroups', newGroups);
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                  >
                    {assetGroups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={asset.assetGroups[0] || 'FA'}
                    disabled
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', background: '#f3f4f6' }}
                  />
                )}
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>FAR Code</label>
                <input
                  type="text"
                  value={asset.farCodes[0] || ''}
                  onChange={(e) => {
                    const newFarCodes = Array(asset.quantity).fill(e.target.value);
                    updateAsset(asset.id, 'farCodes', newFarCodes);
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                />
              </div>
              {isInward && (asset.assetStatuses[0] || 'Fresh') === 'Scrap' && (
                <div>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Asset Condition</label>
                  <input
                    type="text"
                    value={asset.asset_conditions[0] || ''}
                    onChange={(e) => {
                      const newConditions = Array(asset.quantity).fill(e.target.value);
                      updateAsset(asset.id, 'asset_conditions', newConditions);
                    }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                  />
                </div>
              )}
            </>
          )}
        </div>
        {showSerialSection && (
          <div style={{ marginTop: '16px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>Serial Numbers</h5>
            <div style={{ display: 'grid', gap: '8px' }}>
              {Array.from({ length: asset.quantity }).map((_, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={asset.serialNumbers[index] || ''}
                    onChange={(e) => {
                      const newSerials = [...asset.serialNumbers];
                      newSerials[index] = e.target.value;
                      updateAsset(asset.id, 'serialNumbers', newSerials);
                      handleSerialChange(asset, index, e.target.value);
                    }}
                    placeholder={`Serial ${index + 1}`}
                    style={{
                      width: '200px',
                      padding: '8px',
                      border: `1px solid ${assetErrors[asset.id]?.[index] ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    onClick={() => openScanner(asset.id, index, asset.assetType)}
                    style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  >
                    <Camera size={16} />
                  </button>
                  {isInward ? (
                    <>
                      <select
                        value={asset.assetStatuses[index] || 'Fresh'}
                        onChange={(e) => {
                          const newStatuses = [...asset.assetStatuses];
                          newStatuses[index] = e.target.value;
                          updateAsset(asset.id, 'assetStatuses', newStatuses);
                        }}
                        style={{ width: '120px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                      >
                        {assetStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select
                        value={asset.assetGroups[index] || 'FA'}
                        onChange={(e) => {
                          const newGroups = [...asset.assetGroups];
                          newGroups[index] = e.target.value;
                          updateAsset(asset.id, 'assetGroups', newGroups);
                        }}
                        style={{ width: '80px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                      >
                        {assetGroups.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <input
                        type="text"
                        value={asset.farCodes[index] || ''}
                        onChange={(e) => {
                          const newFarCodes = [...asset.farCodes];
                          newFarCodes[index] = e.target.value;
                          updateAsset(asset.id, 'farCodes', newFarCodes);
                        }}
                        style={{ width: '120px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                      />
                      {asset.assetStatuses[index] === 'Scrap' && (
                        <input
                          type="text"
                          value={asset.asset_conditions[index] || ''}
                          onChange={(e) => {
                            const newConditions = [...asset.asset_conditions];
                            newConditions[index] = e.target.value;
                            updateAsset(asset.id, 'asset_conditions', newConditions);
                          }}
                          placeholder="Asset Condition"
                          style={{ width: '200px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={asset.assetStatuses[index] || 'Fresh'}
                        disabled
                        style={{ width: '120px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', background: '#f3f4f6' }}
                      />
                      <input
                        type="text"
                        value={asset.assetGroups[index] || 'FA'}
                        disabled
                        style={{ width: '80px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', background: '#f3f4f6' }}
                      />
                      <input
                        type="text"
                        value={asset.farCodes[index] || ''}
                        disabled
                        style={{ width: '120px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px', background: '#f3f4f6' }}
                      />
                    </>
                  )}
                  {assetErrors[asset.id]?.[index] && (
                    <span style={{ color: '#ef4444', fontSize: '12px' }}>{assetErrors[asset.id][index]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const downloadBulkTemplate = () => {
    const headers = ['Sales Order', 'Employee ID', 'Employee Name', 'Order Type', 'Asset Type', 'Model', 'Configuration', 'Product', 'SD Card Size', 'Profile ID', 'Location', 'Quantity', 'Serial Number', 'Asset Status', 'Asset Group'];
    const rows = [
      ['SO-1-abcde', 'EMP001', 'John Doe', 'Hardware', 'Tablet', 'Lenovo TB301XU', '4G+64 GB (Android-13)', 'Lead', '128 GB', 'Profile 1', 'Trichy', '3', 'SN001', '', ''],
    ];
    const quoteCsvValue = (value: any) => {
      const str = String(value || '');
      const needsQuotes = /["\n\r,]/u.test(str) || str.trimStart() !== str || str.trimEnd() !== str;
      const escaped = str.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };
    const csvTemplate = headers.map(quoteCsvValue).join(',') + '\n' + rows.map(row => row.map(quoteCsvValue).join(',')).join('\n');
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: 'Info', description: 'CSV upload processing (implement full logic)' });
  };

  const downloadUpdateTemplate = () => {
    const headers = ['Serial number', 'Asset group', 'FAR Code'];
    const rows = [
      ['SN001', '', ''],
      ['SN002', '', ''],
    ];
    const quoteCsvValue = (value: any) => {
      const str = String(value || '');
      const needsQuotes = /["\n\r,]/u.test(str) || str.trimStart() !== str || str.trimEnd() !== str;
      const escaped = str.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };
    const csvTemplate = headers.map(quoteCsvValue).join(',') + '\n' + rows.map(row => row.map(quoteCsvValue).join(',')).join('\n');
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvTemplate], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asset_details_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: 'Info', description: 'Bulk update processing (implement full logic)' });
  };

  // Updated: Main asset types without 'Other'
  const mainAssetTypes = ['Tablet', 'TV', 'SD Card', 'Cover', 'Pendrive'];

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Create Order</h2>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#fff' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Order Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Order Type *</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            >
              <option value="">Select Order Type</option>
              {orderTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Sales Order</label>
            <input
              type="text"
              value={salesOrder}
              onChange={(e) => setSalesOrder(e.target.value)}
              placeholder="Auto-generated if empty"
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Employee ID *</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Employee Name *</label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>
        </div>
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '16px', background: '#fff' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Add Assets</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {mainAssetTypes.map(type => (
            <button
              key={type}
              onClick={() => addAsset(type)}
              style={{
                padding: '8px 16px',
                border: '1px solid #3b82f6',
                borderRadius: '4px',
                background: '#3b82f6',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              + {type}
            </button>
          ))}
          <button
            onClick={() => setShowAdditional(!showAdditional)}
            style={{
              padding: '8px 16px',
              border: '1px solid #3b82f6',
              borderRadius: '4px',
              background: '#3b82f6',
              color: '#fff',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            + More {showAdditional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        {showAdditional && (
          <div style={{ marginTop: '8px', padding: '8px', background: '#f3f4f6', borderRadius: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {additionalAssetTypes.map(type => (
              <button
                key={type}
                onClick={() => {
                  addAsset(type);
                  setShowAdditional(false);
                }}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #6b7280',
                  borderRadius: '4px',
                  background: '#fff',
                  color: '#374151',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                + {type}
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        {assets.map(asset => renderAssetFields(asset))}
      </div>
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setShowBulk(!showBulk)}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            background: '#3b82f6',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {showBulk ? 'Hide Bulk Operations' : 'Bulk Operations'}
        </button>
      </div>
      {showBulk && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', background: '#fff' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Bulk Upload (CSV)</h3>
            <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Bulk Upload (CSV)</label>
                <button
                  onClick={downloadBulkTemplate}
                  style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', background: '#fff', cursor: 'pointer' }}
                >
                  Download Template
                </button>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
              />
            </div>
          </div>
          <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', background: '#fff' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>Bulk Update Asset Details (CSV)</h3>
            <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Bulk Update (CSV)</label>
                <button
                  onClick={downloadUpdateTemplate}
                  style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '12px', background: '#fff', cursor: 'pointer' }}
                >
                  Download Template
                </button>
              </div>
              {progress && (
                <div style={{ fontSize: '14px', color: '#3b82f6', marginBottom: '8px' }}>
                  {progress}
                </div>
              )}
              <input
                type="file"
                accept=".csv"
                onChange={handleBulkUpdate}
                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
              />
            </div>
          </div>
        </div>
      )}
      <button
        onClick={createOrder}
        disabled={loading || assets.length === 0}
        style={{
          width: '100%',
          padding: '12px',
          border: 'none',
          borderRadius: '4px',
          background: loading || assets.length === 0 ? '#9ca3af' : '#3b82f6',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: loading || assets.length === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Creating Order...' : 'Create Order'}
      </button>
    </div>
  );
};

export default CreateOrder;