import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Search, Package, Users } from "lucide-react";
import { AssetList } from "./AssetList";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Asset } from "@/hooks/useAssets";

interface DashboardViewProps {
  assets: Asset[];
  onAssign: (assetId: string, userName: string, employeeId: string) => Promise<void>;
  onUnassign: (
    assetId: string,
    remarks?: string,
    receivedBy?: string,
    location?: string,
    configuration?: string | null,
    assetCondition?: string | null,
    status?: string,
    assetValueRecovery?: string | null
  ) => Promise<void>;
  onUpdateAsset: (assetId: string, updatedAsset: any) => Promise<void>;
  onUpdateStatus: (assetId: string, status: string) => Promise<void>;
  onUpdateLocation: (assetId: string, location: string) => Promise<void>;
  onUpdateAssetCheck: (assetId: string, assetCheck: string) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
  userRole: string | null;
}

const DashboardView = ({
  assets,
  onAssign,
  onUnassign,
  onUpdateAsset,
  onUpdateStatus,
  onUpdateLocation,
  onUpdateAssetCheck,
  onDelete,
  userRole,
}: DashboardViewProps) => {
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

  // Unified filter function
  const getFilteredAssets = useMemo(
    () => (excludeFilter: string) => {
      return assets.filter((asset) => {
        const typeMatch =
          excludeFilter === "type" || typeFilter.length === 0 || typeFilter.includes(asset.type);
        const brandMatch =
          excludeFilter === "brand" || brandFilter.length === 0 || brandFilter.includes(asset.brand);
        const configMatch =
          excludeFilter === "config" ||
          configFilter.length === 0 ||
          (asset.configuration && configFilter.includes(asset.configuration));
        const locationMatch =
          excludeFilter === "location" ||
          locationFilter.length === 0 ||
          locationFilter.includes(asset.location);
        const statusMatch =
          excludeFilter === "status" ||
          statusFilter.length === 0 ||
          statusFilter.includes(asset.status);

        const searchMatch =
          searchQuery.trim() === "" ||
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

        const dateMatch =
          excludeFilter === "date" ||
          !dateRange?.from ||
          !dateRange?.to ||
          (() => {
            const from = new Date(dateRange.from);
            const to = new Date(dateRange.to);
            to.setHours(23, 59, 59, 999);

            const assigned = asset.assigned_date ? new Date(asset.assigned_date) : null;
            const returned = asset.return_date ? new Date(asset.return_date) : null;

            return (
              (assigned && assigned >= from && assigned <= to) ||
              (returned && returned >= from && returned <= to)
            );
          })();

        return typeMatch && brandMatch && configMatch && locationMatch && statusMatch && searchMatch && dateMatch;
      });
    },
    [
      assets,
      typeFilter,
      brandFilter,
      configFilter,
      locationFilter,
      statusFilter,
      searchQuery,
      dateRange,
    ]
  );

  // Compute filtered assets for dropdowns
  const filteredForTypes = useMemo(() => getFilteredAssets("type"), [getFilteredAssets]);
  const filteredForBrands = useMemo(() => getFilteredAssets("brand"), [getFilteredAssets]);
  const filteredForConfigs = useMemo(() => getFilteredAssets("config"), [getFilteredAssets]);
  const filteredForLocations = useMemo(() => getFilteredAssets("location"), [getFilteredAssets]);
  const filteredForStatuses = useMemo(() => getFilteredAssets("status"), [getFilteredAssets]);

  // Dropdown options
  const assetTypes = useMemo(
    () => [...new Set(filteredForTypes.map((a) => a.type).filter(Boolean))].sort(),
    [filteredForTypes]
  );
  const assetBrands = useMemo(
    () => [...new Set(filteredForBrands.map((a) => a.brand).filter(Boolean))].sort(),
    [filteredForBrands]
  );
  const assetConfigurations = useMemo(
    () => [...new Set(filteredForConfigs.map((a) => a.configuration).filter(Boolean))].sort(),
    [filteredForConfigs]
  );
  const assetLocations = useMemo(
    () => [...new Set(filteredForLocations.map((a) => a.location).filter(Boolean))].sort(),
    [filteredForLocations]
  );
  const assetStatuses = useMemo(
    () => [...new Set(filteredForStatuses.map((a) => a.status).filter(Boolean))].sort(),
    [filteredForStatuses]
  );

  // Final filtered assets for display and stats
  const filteredAssets = useMemo(() => getFilteredAssets(""), [getFilteredAssets]);

  // Dashboard stats
  const totalInventory = filteredAssets.filter((a) => a.status !== "Sold").length;
  const allocatedAssets = filteredAssets.filter((a) => a.status === "Assigned").length;
  const currentStock = filteredAssets.filter((a) => a.status === "Available").length;
  const scrapDamageAssets = filteredAssets.filter((a) => a.status === "Scrap/Damage").length;
  const saleAssets = filteredAssets.filter((a) => a.status === "Sale").length;
  const soldAssets = filteredAssets.filter((a) => a.status === "Sold").length;
  const lostAssets = filteredAssets.filter((a) => a.status === "Lost").length;
  const empDamageAssets = filteredAssets.filter((a) => a.status === "Emp Damage").length;
  const courierDamageAssets = filteredAssets.filter((a) => a.status === "Courier Damage").length;

  const totalAssetValueRecovery = filteredAssets
    .filter((a) => a.status === "Sold" && a.asset_value_recovery)
    .reduce((sum, a) => {
      const value = typeof a.asset_value_recovery === 'number' 
        ? a.asset_value_recovery 
        : parseFloat(String(a.asset_value_recovery || '0'));
      return sum + value;
    }, 0)
    .toFixed(2);

  const getAssetTypeCounts = (status: string) => {
    const filtered = status === "all" ? filteredAssets : filteredAssets.filter((a) => a.status === status);
    return assetTypes.reduce((acc, type) => {
      acc[type] = filtered.filter((a) => a.type === type).length;
      return acc;
    }, {} as Record<string, number>);
  };

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

  // Reset invalid selections - use ref to track previous values and prevent infinite loops
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
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Total Inventory */}
        <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex justify-between items-start">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalInventory}</div>
                <p className="text-xs text-muted-foreground mt-2">Total assets in system</p>
              </div>
              <div className="w-1/2 text-right">
                <div className="h-24 overflow-y-auto pr-2">
                  {Object.entries(getAssetTypeCounts("all"))
                    .filter(([_, count]) => count > 0)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-end mb-1 text-xs">
                        <span className="mr-2">{type}:</span>
                        <span className="w-6 text-right">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allocated */}
        <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated</CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex justify-between items-start">
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{allocatedAssets}</div>
                <p className="text-xs text-muted-foreground mt-2">Currently in use</p>
              </div>
              <div className="w-1/2 text-right">
                <div className="h-24 overflow-y-auto pr-2">
                  {Object.entries(getAssetTypeCounts("Assigned"))
                    .filter(([_, count]) => count > 0)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-end mb-1 text-xs">
                        <span className="mr-2">{type}:</span>
                        <span className="w-6 text-right">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Stock */}
        <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Stock</CardTitle>
            <Package className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex justify-between items-start">
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{currentStock}</div>
                <p className="text-xs text-muted-foreground mt-2">Ready for allocation</p>
                <div className="text-xs text-muted-foreground mt-2 text-left flex flex-wrap gap-2">
                  <p>Sale: {saleAssets}</p>
                </div>
              </div>
              <div className="w-1/2 text-right">
                <div className="h-24 overflow-y-auto pr-2">
                  {Object.entries(getAssetTypeCounts("Available"))
                    .filter(([_, count]) => count > 0)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-end mb-1 text-xs">
                        <span className="mr-2">{type}:</span>
                        <span className="w-6 text-right">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scrap/Damage */}
        <Card className="shadow-card hover:shadow-elegant transition-smooth cursor-pointer bg-gradient-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scrap/Damage</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex justify-between items-start">
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {scrapDamageAssets + empDamageAssets + courierDamageAssets}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Out of service</p>
                <div className="text-xs text-muted-foreground mt-2 text-left flex flex-wrap gap-2">
                  <p>Lost: {lostAssets}</p>
                  <p>Sold: {soldAssets}</p>
                  <p>TAV Recovered: ₹{totalAssetValueRecovery}</p>
                </div>
              </div>
              <div className="w-1/2 text-right">
                <div className="h-24 overflow-y-auto pr-2">
                  {Object.entries(
                    filteredAssets.reduce((acc, a) => {
                      if (["Scrap/Damage", "Emp Damage", "Courier Damage"].includes(a.status)) {
                        acc[a.type] = (acc[a.type] || 0) + 1;
                      }
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .filter(([_, count]) => count > 0)
                    .map(([type, count]) => (
                      <div key={type} className="flex justify-end mb-1 text-xs">
                        <span className="mr-2">{type}:</span>
                        <span className="w-6 text-right">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
            {/* Asset Type */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Asset Type</label>
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
                      placeholder="Search types..."
                      value={searchQueryType}
                      onChange={(e) => setSearchQueryType(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetTypes
                      .filter((type) => type.toLowerCase().includes(searchQueryType.toLowerCase()))
                      .map((type) => (
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

            {/* Brand */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Brand</label>
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
                      placeholder="Search brands..."
                      value={searchQueryBrand}
                      onChange={(e) => setSearchQueryBrand(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetBrands
                      .filter((brand) => brand.toLowerCase().includes(searchQueryBrand.toLowerCase()))
                      .map((brand) => (
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

            {/* Configuration */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Configuration</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {configFilter.length === 0
                      ? "All Configurations"
                      : `${configFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Search configs..."
                      value={searchQueryConfig}
                      onChange={(e) => setSearchQueryConfig(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetConfigurations
                      .filter((config) =>
                        config.toLowerCase().includes(searchQueryConfig.toLowerCase())
                      )
                      .map((config) => (
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

            {/* Location */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Asset Location</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {locationFilter.length === 0
                      ? "All Locations"
                      : `${locationFilter.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      type="text"
                      placeholder="Search locations..."
                      value={searchQueryLocation}
                      onChange={(e) => setSearchQueryLocation(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetLocations
                      .filter((location) =>
                        location.toLowerCase().includes(searchQueryLocation.toLowerCase())
                      )
                      .map((location) => (
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
                          <label
                            htmlFor={`location-${location}`}
                            className="text-xs cursor-pointer flex-1"
                          >
                            {location}
                          </label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Status</label>
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
                      placeholder="Search statuses..."
                      value={searchQueryStatus}
                      onChange={(e) => setSearchQueryStatus(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      className="w-full h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetStatuses
                      .filter((status) =>
                        status.toLowerCase().includes(searchQueryStatus.toLowerCase())
                      )
                      .map((status) => (
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

            {/* Date Range */}
            <div className="space-y-1">
              <label className="text-xs font-medium">Date Range (Assigned/Returned)</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} className="h-7" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset List */}
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
        viewType="dashboard"
      />
    </>
  );
};

export default DashboardView;