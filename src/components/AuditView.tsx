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

interface AuditViewProps {
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

const AuditView = ({
  assets,
  onAssign,
  onUnassign,
  onUpdateAsset,
  onUpdateStatus,
  onUpdateLocation,
  onUpdateAssetCheck,
  onDelete,
  userRole,
}: AuditViewProps) => {
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

  // Unified filter function: applies all filters except the one being excluded
  const getFilteredAssets = useMemo(
    () => (excludeFilter: string) => {
      return assets.filter((asset) => {
        // Field filters
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

        // Search filter
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
          ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()));

        // Date filter (assigned or returned)
        const dateMatch =
          excludeFilter === "date" ||
          !dateRange?.from ||
          !dateRange?.to ||
          (() => {
            const from = new Date(dateRange.from);
            const to = new Date(dateRange.to);
            to.setHours(23, 59, 59, 999); // include full end day

            const assigned = asset.assigned_date ? new Date(asset.assigned_date) : null;
            const returned = asset.return_date ? new Date(asset.return_date) : null;

            return (
              (assigned && assigned >= from && assigned <= to) ||
              (returned && returned >= from && returned <= to)
            );
          })();

        // Exclude Assigned assets
        const notAssigned = asset.status !== "Assigned";

        return (
          typeMatch &&
          brandMatch &&
          configMatch &&
          locationMatch &&
          statusMatch &&
          searchMatch &&
          dateMatch &&
          notAssigned
        );
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

  // Compute filtered assets for dropdowns (excluding self)
  const filteredForTypes = useMemo(() => getFilteredAssets("type"), [getFilteredAssets]);
  const filteredForBrands = useMemo(() => getFilteredAssets("brand"), [getFilteredAssets]);
  const filteredForConfigs = useMemo(() => getFilteredAssets("config"), [getFilteredAssets]);
  const filteredForLocations = useMemo(() => getFilteredAssets("location"), [getFilteredAssets]);
  const filteredForStatuses = useMemo(() => getFilteredAssets("status"), [getFilteredAssets]);

  // Dropdown options based on filtered assets
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
    () =>
      [...new Set(filteredForStatuses.map((a) => a.status).filter((s) => s !== "Assigned" && Boolean(s)))]
        .sort(),
    [filteredForStatuses]
  );

  // Final filtered assets for display
  const filteredAssets = useMemo(() => getFilteredAssets(""), [getFilteredAssets]);

  // Clear all filters
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

  // Reset invalid filter selections when options change - use ref to prevent infinite loops
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
            {/* Asset Type */}
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
                      .filter((type: string) =>
                        type.toLowerCase().includes(searchQueryType.toLowerCase())
                      )
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
                          <Label
                            htmlFor={`type-${type}`}
                            className="text-xs cursor-pointer flex-1"
                          >
                            {type}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Brand */}
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
                      .filter((brand: string) =>
                        brand.toLowerCase().includes(searchQueryBrand.toLowerCase())
                      )
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
                          <Label
                            htmlFor={`brand-${brand}`}
                            className="text-xs cursor-pointer flex-1"
                          >
                            {brand}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Configuration */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Configuration</Label>
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
                      .filter((config: string) =>
                        config.toLowerCase().includes(searchQueryConfig.toLowerCase())
                      )
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
                          <Label
                            htmlFor={`config-${config}`}
                            className="text-xs cursor-pointer flex-1"
                          >
                            {config}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Asset Location</Label>
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
                      .filter((location: string) =>
                        location.toLowerCase().includes(searchQueryLocation.toLowerCase())
                      )
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
                          <Label
                            htmlFor={`location-${location}`}
                            className="text-xs cursor-pointer flex-1"
                          >
                            {location}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status */}
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
                      .filter((status: string) =>
                        status.toLowerCase().includes(searchQueryStatus.toLowerCase())
                      )
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
                          <Label
                            htmlFor={`status-${status}`}
                            className="text-xs cursor-pointer flex-1"
                          >
                            {status}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Date Range */}
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
        viewType="audit"
      />
    </>
  );
};

export default AuditView;