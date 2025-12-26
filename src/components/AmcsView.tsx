import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
import { AssetList } from "./AssetList";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Asset } from "@/hooks/useAssets";

interface AmcsViewProps {
  assets: Asset[];
  onAssign: (assetId: string, userName: string, employeeId: string) => Promise<void>;
  onUnassign: (assetId: string, remarks?: string, receivedBy?: string, location?: string, configuration?: string | null, assetCondition?: string | null, status?: string, assetValueRecovery?: string | null) => Promise<void>;
  onUpdateAsset: (assetId: string, updatedAsset: any) => Promise<void>;
  onUpdateStatus: (assetId: string, status: string) => Promise<void>;
  onUpdateLocation: (assetId: string, location: string) => Promise<void>;
  onUpdateAssetCheck: (assetId: string, assetCheck: string) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
  userRole: string | null;
}

const AmcsView = ({
  assets,
  onAssign,
  onUnassign,
  onUpdateAsset,
  onUpdateStatus,
  onUpdateLocation,
  onUpdateAssetCheck,
  onDelete,
  userRole,
}: AmcsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [configFilter, setConfigFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [searchQueryType, setSearchQueryType] = useState("");
  const [searchQueryBrand, setSearchQueryBrand] = useState("");
  const [searchQueryConfig, setSearchQueryConfig] = useState("");
  const [searchQueryLocation, setSearchQueryLocation] = useState("");
  const [searchQueryStatus, setSearchQueryStatus] = useState("");

  // Compute filtered assets based on all active filters except the one being computed
  const getFilteredAssets = useMemo(() => (excludeFilter: string) => {
    return assets.filter((asset) => {
      const typeMatch = excludeFilter === "type" || typeFilter.length === 0 || typeFilter.includes(asset.type);
      const brandMatch = excludeFilter === "brand" || brandFilter.length === 0 || brandFilter.includes(asset.brand);
      const configMatch = excludeFilter === "config" || configFilter.length === 0 || (asset.configuration && configFilter.includes(asset.configuration));
      const locationMatch = excludeFilter === "location" || locationFilter.length === 0 || locationFilter.includes(asset.location);
      const statusMatch = excludeFilter === "status" || statusFilter.length === 0 || statusFilter.includes(asset.status);
      return typeMatch && brandMatch && configMatch && locationMatch && statusMatch;
    });
  }, [assets, typeFilter, brandFilter, configFilter, locationFilter, statusFilter]);

  // Compute options for each dropdown based on filtered assets
  const assetTypes = useMemo(() => [...new Set(assets.map((asset) => asset.type).filter(Boolean))].sort(), [assets]);
  const assetBrands = useMemo(() => [...new Set(assets.map((asset) => asset.brand).filter(Boolean))].sort(), [assets]);
  const assetConfigurations = useMemo(() => [...new Set(assets.map((asset) => asset.configuration).filter(Boolean))].sort(), [assets]);
  const assetLocations = useMemo(() => [...new Set(assets.map((asset) => asset.location).filter(Boolean))].sort(), [assets]);
  const assetStatuses = useMemo(() => [...new Set(assets.map((asset) => asset.status).filter(Boolean))].sort(), [assets]);

  // Assets filtered by all active filters for display
  const filteredAssets = useMemo(() => assets.filter((asset) => {
    const typeMatch = typeFilter.length === 0 || typeFilter.includes(asset.type);
    const brandMatch = brandFilter.length === 0 || brandFilter.includes(asset.brand);
    const configMatch = configFilter.length === 0 || (asset.configuration && configFilter.includes(asset.configuration));
    const locationMatch = locationFilter.length === 0 || locationFilter.includes(asset.location);
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(asset.status);

    const searchMatch = searchQuery.trim() === "" ||
      [
        asset.asset_id || "",
        asset.name || "",
        asset.type || "",
        asset.brand || "",
        asset.configuration || "",
        asset.serial_number || "",
        asset.employee_id || "",
        asset.assigned_to || "",
        asset.status || "",
        asset.location || "",
        asset.created_by || "",
        asset.updated_by || "",
        asset.received_by || "",
        asset.remarks || "",
        asset.warranty_start || "",
        asset.warranty_end || "",
        asset.asset_check || "",
        asset.far_code || "",
      ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()));

    const dateMatch = !dateRange?.from || !dateRange?.to ||
      ((asset.assigned_date || asset.return_date) &&
        new Date(asset.assigned_date || asset.return_date) >= new Date(dateRange.from) &&
        new Date(asset.assigned_date || asset.return_date) <= new Date(dateRange.to));

    return typeMatch && brandMatch && configMatch && locationMatch && statusMatch && searchMatch && dateMatch;
  }), [assets, searchQuery, dateRange, typeFilter, brandFilter, configFilter, locationFilter, statusFilter]);

  const clearFilters = () => {
    setTypeFilter([]);
    setBrandFilter([]);
    setConfigFilter([]);
    setLocationFilter([]);
    setStatusFilter([]);
    setDateRange(undefined);
    setSearchQuery("");
    setSearchQueryType("");
    setSearchQueryBrand("");
    setSearchQueryConfig("");
    setSearchQueryLocation("");
    setSearchQueryStatus("");
  };

  // Reset invalid filter selections - use ref to prevent infinite loops
  const prevOptionsRef = useRef({
    types: '',
    brands: '',
    configs: '',
    locations: '',
    statuses: '',
  });

  useEffect(() => {
    const typesStr = assetTypes.join(',');
    const brandsStr = assetBrands.join(',');
    const configsStr = assetConfigurations.join(',');
    const locationsStr = assetLocations.join(',');
    const statusesStr = assetStatuses.join(',');

    // Only update if the options have actually changed
    const hasChanged = 
      prevOptionsRef.current.types !== typesStr ||
      prevOptionsRef.current.brands !== brandsStr ||
      prevOptionsRef.current.configs !== configsStr ||
      prevOptionsRef.current.locations !== locationsStr ||
      prevOptionsRef.current.statuses !== statusesStr;

    if (hasChanged) {
      prevOptionsRef.current = {
        types: typesStr,
        brands: brandsStr,
        configs: configsStr,
        locations: locationsStr,
        statuses: statusesStr,
      };

      setTypeFilter((prev) => {
        const filtered = prev.filter((t) => assetTypes.includes(t));
        return filtered.length !== prev.length ? filtered : prev;
      });
      setBrandFilter((prev) => {
        const filtered = prev.filter((b) => assetBrands.includes(b));
        return filtered.length !== prev.length ? filtered : prev;
      });
      setConfigFilter((prev) => {
        const filtered = prev.filter((c) => assetConfigurations.includes(c));
        return filtered.length !== prev.length ? filtered : prev;
      });
      setLocationFilter((prev) => {
        const filtered = prev.filter((l) => assetLocations.includes(l));
        return filtered.length !== prev.length ? filtered : prev;
      });
      setStatusFilter((prev) => {
        const filtered = prev.filter((s) => assetStatuses.includes(s));
        return filtered.length !== prev.length ? filtered : prev;
      });
    }
  }, [assetTypes, assetBrands, assetConfigurations, assetLocations, assetStatuses]);

  return (
    <>
      <Card className="shadow-card mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-1 text-base">
              <Filter className="h-3 w-3 text-primary" />
              Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-7 text-xs"
                />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="hover:bg-destructive hover:text-destructive-foreground text-xs h-6"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Asset Type</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {typeFilter.length === 0 ? "All Types" : `${typeFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQueryType}
                      onChange={(e) => setSearchQueryType(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetTypes
                      .filter((type: string) => type.toLowerCase().includes(searchQueryType.toLowerCase()))
                      .map((type: string) => (
                        <div key={type} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`type-${type}`}
                            checked={typeFilter.includes(type)}
                            onCheckedChange={(checked) => {
                              setTypeFilter((prev) =>
                                checked ? [...prev, type] : prev.filter((t) => t !== type)
                              );
                            }}
                          />
                          <label htmlFor={`type-${type}`} className="text-xs cursor-pointer flex-1">
                            {type}
                          </label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Brand</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {brandFilter.length === 0 ? "All Brands" : `${brandFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQueryBrand}
                      onChange={(e) => setSearchQueryBrand(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetBrands
                      .filter((brand: string) => brand.toLowerCase().includes(searchQueryBrand.toLowerCase()))
                      .map((brand: string) => (
                        <div key={brand} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`brand-${brand}`}
                            checked={brandFilter.includes(brand)}
                            onCheckedChange={(checked) => {
                              setBrandFilter((prev) =>
                                checked ? [...prev, brand] : prev.filter((b) => b !== brand)
                              );
                            }}
                          />
                          <label htmlFor={`brand-${brand}`} className="text-xs cursor-pointer flex-1">
                            {brand}
                          </label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Configuration</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {configFilter.length === 0 ? "All Configurations" : `${configFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQueryConfig}
                      onChange={(e) => setSearchQueryConfig(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetConfigurations
                      .filter((config: string) => config.toLowerCase().includes(searchQueryConfig.toLowerCase()))
                      .map((config: string) => (
                        <div key={config} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`config-${config}`}
                            checked={configFilter.includes(config)}
                            onCheckedChange={(checked) => {
                              setConfigFilter((prev) =>
                                checked ? [...prev, config] : prev.filter((c) => c !== config)
                              );
                            }}
                          />
                          <label htmlFor={`config-${config}`} className="text-xs cursor-pointer flex-1">
                            {config}
                          </label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Asset Location</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {locationFilter.length === 0 ? "All Locations" : `${locationFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQueryLocation}
                      onChange={(e) => setSearchQueryLocation(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetLocations
                      .filter((location: string) => location.toLowerCase().includes(searchQueryLocation.toLowerCase()))
                      .map((location: string) => (
                        <div key={location} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`location-${location}`}
                            checked={locationFilter.includes(location)}
                            onCheckedChange={(checked) => {
                              setLocationFilter((prev) =>
                                checked ? [...prev, location] : prev.filter((l) => l !== location)
                              );
                            }}
                          />
                          <label htmlFor={`location-${location}`} className="text-xs cursor-pointer flex-1">
                            {location}
                          </label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {statusFilter.length === 0 ? "All Statuses" : `${statusFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Type to search..."
                      value={searchQueryStatus}
                      onChange={(e) => setSearchQueryStatus(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetStatuses
                      .filter((status: string) => status.toLowerCase().includes(searchQueryStatus.toLowerCase()))
                      .map((status: string) => (
                        <div key={status} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`status-${status}`}
                            checked={statusFilter.includes(status)}
                            onCheckedChange={(checked) => {
                              setStatusFilter((prev) =>
                                checked ? [...prev, status] : prev.filter((s) => s !== status)
                              );
                            }}
                          />
                          <label htmlFor={`status-${status}`} className="text-xs cursor-pointer flex-1">
                            {status}
                          </label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Date Range (Assigned/Returned)</Label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} className="h-7" />
            </div>
          </div>
        </CardContent>
      </Card>

      <AssetList
        assets={filteredAssets}
        onAssign={onAssign}
        onUnassign={onUnassign}
        onUpdateAsset={onUpdateAsset}
        onUpdateStatus={onUpdateStatus}
        onUpdateLocation={onUpdateLocation}
        onUpdateAssetCheck={onUpdateAssetCheck}
        onDelete={onDelete}
        dateRange={dateRange}
        typeFilter={typeFilter}
        brandFilter={brandFilter}
        configFilter={configFilter}
        locationFilter={locationFilter}
        statusFilter={statusFilter}
        defaultRowsPerPage={10}
        viewType="amcs"
      />
    </>
  );
};

export default AmcsView;