import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';

export interface Asset {
  id: string;
  asset_id: string;
  name: string;
  type: string;
  brand: string;
  configuration: string | null;
  serial_number: string;
  assigned_to: string | null;
  employee_id: string | null;
  status: string;
  location: string;
  assigned_date: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  received_by: string | null;
  return_date: string | null;
  remarks: string | null;
  asset_check: string;
  warranty_start: string | null;
  warranty_end: string | null;
  warranty_status: string | null;
  provider: string | null;
  asset_value_recovery?: number | null;
  asset_condition?: string | null;
  far_code?: string | null;
  amc_start?: string | null;
  amc_end?: string | null;
}

export const useAssets = () => {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async (): Promise<Asset[]> => {
      // Fetch all assets without pagination
      const response = await api.assets.getAllWithoutPagination();
      return response.data;
    },
    staleTime: 0, // Always consider data stale to allow immediate refetch after updates
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
};

export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (asset: Omit<Asset, 'id'>) => {
      const response = await api.assets.create(asset);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Asset> & { id: string }) => {
      const response = await api.assets.update(id, updates);
      return { id, updatedAsset: response.data };
    },
    onSuccess: async (data) => {
      // Update the cache with the returned data immediately
      queryClient.setQueryData<Asset[]>(['assets'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((asset) => 
          asset.id === data.id ? { ...asset, ...data.updatedAsset } : asset
        );
      });
      
      // Invalidate to ensure we get fresh data on next fetch
      await queryClient.invalidateQueries({ 
        queryKey: ['assets'],
        refetchType: 'active'
      });
    },
  });
};

export const useUnassignAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, remarks, receivedBy, location, configuration, assetCondition, status }: { 
      id: string; 
      remarks?: string; 
      receivedBy?: string; 
      location?: string;
      configuration?: string | null;
      assetCondition?: string | null;
      status?: string;
    }) => {
      // First fetch current asset
      const currentAssetResponse = await api.assets.getById(id);
      const currentAsset = currentAssetResponse.data;

      const updatePayload: Partial<Asset> = {
        status: status || 'Available',
        assigned_to: null,
        employee_id: null,
        assigned_date: null,
        return_date: new Date().toISOString(),
        received_by: receivedBy || currentAsset.updated_by || 'unknown_user',
        updated_by: receivedBy || currentAsset.updated_by || 'unknown_user',
        updated_at: new Date().toISOString(),
        configuration: configuration !== undefined ? configuration : currentAsset.configuration,
      };

      if (remarks !== undefined && remarks !== currentAsset.remarks) {
        updatePayload.remarks = remarks || null;
      }
      if (location !== undefined && location !== currentAsset.location) {
        updatePayload.location = location;
      }
      if (assetCondition !== undefined) {
        updatePayload.asset_condition = assetCondition || null;
      }

      const response = await api.assets.update(id, updatePayload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await api.assets.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
};