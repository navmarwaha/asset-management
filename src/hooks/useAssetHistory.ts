import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";

export const useAssetHistory = (assetId: string | null) => {
  return useQuery({
    queryKey: ["asset_history", assetId],
    queryFn: async () => {
      if (!assetId) return [];
      const response = await api.assets.getHistory(assetId);
      return response.data;
    },
    enabled: !!assetId,
  });
};