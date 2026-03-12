/*  SummaryView.tsx  –  Location → Type → Brand Summary + CSV  */
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Asset } from "@/hooks/useAssets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DatePickerWithRange } from "./DatePickerWithRange";
import { DateRange } from "react-day-picker";

interface SummaryViewProps {
  assets: Asset[];
}

const SummaryView = ({ assets }: SummaryViewProps) => {
  /* ---------- STATE (all filters) ---------- */
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [conditionFilter, setConditionFilter] = useState<string[]>([]);
  const [configFilter, setConfigFilter] = useState<string[]>([]);
  const [warrantyFilter, setWarrantyFilter] = useState<string[]>([]);
  const [assetCheckFilter, setAssetCheckFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  // Dropdown search
  const [searchQueryType, setSearchQueryType] = useState("");
  const [searchQueryBrand, setSearchQueryBrand] = useState("");
  const [searchQueryStatus, setSearchQueryStatus] = useState("");
  const [searchQueryLocation, setSearchQueryLocation] = useState("");
  const [searchQueryCondition, setSearchQueryCondition] = useState("");
  const [searchQueryConfig, setSearchQueryConfig] = useState("");
  const [searchQueryWarranty, setSearchQueryWarranty] = useState("");
  const [searchQueryAssetCheck, setSearchQueryAssetCheck] = useState("");

  const rowsPerPage = 15;

  /* ---------- FILTER LOGIC ---------- */
  const getFilteredAssets = useMemo(
    () => (excludeFilter: string) => {
      return assets.filter((asset) => {
        const typeMatch =
          excludeFilter === "type" ||
          typeFilter.length === 0 ||
          typeFilter.includes(asset.type);
        const brandMatch =
          excludeFilter === "brand" ||
          brandFilter.length === 0 ||
          brandFilter.includes(asset.brand);
        const statusMatch =
          excludeFilter === "status" ||
          statusFilter.length === 0 ||
          statusFilter.includes(asset.status);
        const locationMatch =
          excludeFilter === "location" ||
          locationFilter.length === 0 ||
          locationFilter.includes(asset.location);
        const conditionMatch =
          excludeFilter === "condition" ||
          conditionFilter.length === 0 ||
          conditionFilter.includes(asset.asset_condition || "Unknown");
        const configMatch =
          excludeFilter === "config" ||
          configFilter.length === 0 ||
          (asset.configuration && configFilter.includes(asset.configuration));
        const warrantyMatch =
          excludeFilter === "warranty" ||
          warrantyFilter.length === 0 ||
          warrantyFilter.includes(asset.warranty_status || "Unknown");
        const assetCheckMatch =
          excludeFilter === "assetCheck" ||
          assetCheckFilter.length === 0 ||
          assetCheckFilter.includes(asset.asset_check || "Unknown");

        const searchMatch =
          !searchTerm ||
          [
            asset.employee_id ?? "",
            asset.assigned_to ?? "",
            asset.asset_id ?? "",
            asset.name ?? "",
            asset.type ?? "",
            asset.brand ?? "",
            asset.configuration ?? "",
            asset.serial_number ?? "",
            asset.status ?? "",
            asset.location ?? "",
            asset.created_by ?? "",
            asset.updated_by ?? "",
            asset.received_by ?? "",
            asset.remarks ?? "",
            asset.warranty_start ?? "",
            asset.warranty_end ?? "",
            asset.amc_start ?? "",
            asset.amc_end ?? "",
            asset.asset_check ?? "",
            asset.asset_condition ?? "",
            asset.warranty_status ?? "",
            asset.asset_value_recovery?.toString() ?? "",
          ].some((v) => v.toLowerCase().includes(searchTerm.toLowerCase()));

        const dateMatch =
          !dateRange?.from ||
          !dateRange?.to ||
          (() => {
            const from = new Date(dateRange.from!);
            const to = new Date(dateRange.to!);
            to.setHours(23, 59, 59, 999);
            const assigned = asset.assigned_date
              ? new Date(asset.assigned_date)
              : null;
            const returned = asset.return_date
              ? new Date(asset.return_date)
              : null;
            return (
              (assigned && assigned >= from && assigned <= to) ||
              (returned && returned >= from && returned <= to)
            );
          })();

        return (
          typeMatch &&
          brandMatch &&
          statusMatch &&
          locationMatch &&
          conditionMatch &&
          configMatch &&
          warrantyMatch &&
          assetCheckMatch &&
          searchMatch &&
          dateMatch
        );
      });
    },
    [
      assets,
      typeFilter,
      brandFilter,
      statusFilter,
      locationFilter,
      conditionFilter,
      configFilter,
      warrantyFilter,
      assetCheckFilter,
      searchTerm,
      dateRange,
    ]
  );

  /* ---------- DROPDOWN OPTIONS ---------- */
  const filteredForTypes = useMemo(() => getFilteredAssets("type"), [getFilteredAssets]);
  const filteredForBrands = useMemo(() => getFilteredAssets("brand"), [getFilteredAssets]);
  const filteredForStatuses = useMemo(() => getFilteredAssets("status"), [getFilteredAssets]);
  const filteredForLocations = useMemo(() => getFilteredAssets("location"), [getFilteredAssets]);
  const filteredForConditions = useMemo(() => getFilteredAssets("condition"), [getFilteredAssets]);
  const filteredForConfigs = useMemo(() => getFilteredAssets("config"), [getFilteredAssets]);
  const filteredForWarranties = useMemo(() => getFilteredAssets("warranty"), [getFilteredAssets]);
  const filteredForAssetChecks = useMemo(() => getFilteredAssets("assetCheck"), [getFilteredAssets]);

  const assetTypes = useMemo(() => [...new Set(filteredForTypes.map(a => a.type).filter(Boolean))].sort(), [filteredForTypes]);
  const assetBrands = useMemo(() => [...new Set(filteredForBrands.map(a => a.brand).filter(Boolean))].sort(), [filteredForBrands]);
  const assetStatuses = useMemo(() => [...new Set(filteredForStatuses.map(a => a.status).filter(Boolean))].sort(), [filteredForStatuses]);
  const assetLocations = useMemo(() => [...new Set(filteredForLocations.map(a => a.location).filter(Boolean))].sort(), [filteredForLocations]);
  const assetConditions = useMemo(() => [...new Set(filteredForConditions.map(a => a.asset_condition || "Unknown").filter(Boolean))].sort(), [filteredForConditions]);
  const assetConfigurations = useMemo(() => [...new Set(filteredForConfigs.map(a => a.configuration).filter(Boolean))].sort(), [filteredForConfigs]);
  const warrantyStatuses = useMemo(() => [...new Set(filteredForWarranties.map(a => a.warranty_status || "Unknown").filter(Boolean))].sort(), [filteredForWarranties]);
  const assetChecks = useMemo(() => [...new Set(filteredForAssetChecks.map(a => a.asset_check || "Unknown").filter(Boolean))].sort(), [filteredForAssetChecks]);

  const filteredAssets = useMemo(() => getFilteredAssets(""), [getFilteredAssets]);

  /* ---------- TOTAL RECOVERY ---------- */
  const totalRecovery = useMemo(() => {
    return filteredAssets.reduce((s, a) => s + (Number(a.asset_value_recovery) || 0), 0);
  }, [filteredAssets]);

  /* ---------- GROUPED SUMMARY: Location → Type → Brand ---------- */
  type Row = {
    location: string;
    assetType: string;
    brand: string;
    counts: Record<string, number>;
  };

  const summaryData = useMemo(() => {
    const map = new Map<string, Row>();

    filteredAssets.forEach((asset) => {
      const key = `${asset.location}|${asset.type}|${asset.brand}`;
      let row = map.get(key);
      if (!row) {
        row = {
          location: asset.location,
          assetType: asset.type,
          brand: asset.brand,
          counts: Object.fromEntries(assetStatuses.map(s => [s, 0])),
        };
        map.set(key, row);
      }
      if (assetStatuses.includes(asset.status)) {
        row.counts[asset.status] += 1;
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.location !== b.location) return a.location.localeCompare(b.location);
      if (a.assetType !== b.assetType) return a.assetType.localeCompare(b.assetType);
      return a.brand.localeCompare(b.brand);
    });
  }, [filteredAssets, assetStatuses]);

  const grandTotals = useMemo(() => {
    const totals = Object.fromEntries(assetStatuses.map(s => [s, 0]));
    summaryData.forEach(r => {
      assetStatuses.forEach(st => (totals[st] += r.counts[st]));
    });
    return totals;
  }, [summaryData, assetStatuses]);

  const tableData = summaryData;
  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    return tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  }, [tableData, currentPage]);

  /* ---------- PAGINATION ---------- */
  const getPageNumbers = () => {
    const pageNumbers: number[] = [];
    const max = 5;
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = Math.min(totalPages, start + max - 1);
    if (end - start + 1 < max) start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pageNumbers.push(i);
    return { startPage: start, endPage: end, pageNumbers };
  };
  const { startPage, endPage, pageNumbers } = getPageNumbers();

  /* ---------- COLORS ---------- */
  const statusColors: Record<string, string> = {
    Available: "bg-green-600",
    Assigned: "bg-yellow-600",
    "Scrap/Damage": "bg-red-600",
    Sold: "bg-blue-800",
  };
  const getStatusColor = (s: string) => statusColors[s] ?? "bg-gray-500";

  /* ---------- CLEAR FILTERS ---------- */
  const clearFilters = () => {
    setTypeFilter([]);
    setBrandFilter([]);
    setStatusFilter([]);
    setLocationFilter([]);
    setConditionFilter([]);
    setConfigFilter([]);
    setWarrantyFilter([]);
    setAssetCheckFilter([]);
    setSearchTerm("");
    setDateRange(undefined);
    setSearchQueryType("");
    setSearchQueryBrand("");
    setSearchQueryStatus("");
    setSearchQueryLocation("");
    setSearchQueryCondition("");
    setSearchQueryConfig("");
    setSearchQueryWarranty("");
    setSearchQueryAssetCheck("");
    setCurrentPage(1);
  };

  /* ---------- SYNC FILTERS ---------- */
  // Use ref to track previous values and prevent infinite loops
  const prevOptionsRef = useRef({
    types: '',
    brands: '',
    statuses: '',
    locations: '',
    conditions: '',
    configs: '',
    warranties: '',
    checks: '',
  });

  useEffect(() => {
    const typesStr = assetTypes.join(',');
    const brandsStr = assetBrands.join(',');
    const statusesStr = assetStatuses.join(',');
    const locationsStr = assetLocations.join(',');
    const conditionsStr = assetConditions.join(',');
    const configsStr = assetConfigurations.join(',');
    const warrantiesStr = warrantyStatuses.join(',');
    const checksStr = assetChecks.join(',');

    // Only update if the options have actually changed
    const hasChanged = 
      prevOptionsRef.current.types !== typesStr ||
      prevOptionsRef.current.brands !== brandsStr ||
      prevOptionsRef.current.statuses !== statusesStr ||
      prevOptionsRef.current.locations !== locationsStr ||
      prevOptionsRef.current.conditions !== conditionsStr ||
      prevOptionsRef.current.configs !== configsStr ||
      prevOptionsRef.current.warranties !== warrantiesStr ||
      prevOptionsRef.current.checks !== checksStr;

    if (hasChanged) {
      prevOptionsRef.current = {
        types: typesStr,
        brands: brandsStr,
        statuses: statusesStr,
        locations: locationsStr,
        conditions: conditionsStr,
        configs: configsStr,
        warranties: warrantiesStr,
        checks: checksStr,
      };

      setTypeFilter(p => {
        const filtered = p.filter(v => assetTypes.includes(v));
        return filtered.length !== p.length ? filtered : p;
      });
      setBrandFilter(p => {
        const filtered = p.filter(v => assetBrands.includes(v));
        return filtered.length !== p.length ? filtered : p;
      });
      setStatusFilter(p => {
        const filtered = p.filter(v => assetStatuses.includes(v));
        return filtered.length !== p.length ? filtered : p;
      });
      setLocationFilter(p => {
        const filtered = p.filter(v => assetLocations.includes(v));
        return filtered.length !== p.length ? filtered : p;
      });
      setConditionFilter(p => {
        const filtered = p.filter(v => assetConditions.includes(v));
        return filtered.length !== p.length ? filtered : p;
      });
      setConfigFilter(p => {
        const filtered = p.filter(v => assetConfigurations.includes(v));
        return filtered.length !== p.length ? filtered : p;
      });
      setWarrantyFilter(p => {
        const filtered = p.filter(v => warrantyStatuses.includes(v));
        return filtered.length !== p.length ? filtered : p;
      });
      setAssetCheckFilter(p => {
        const filtered = p.filter(v => assetChecks.includes(v));
        return filtered.length !== p.length ? filtered : p;
      });
    }
  }, [assetTypes, assetBrands, assetStatuses, assetLocations, assetConditions, assetConfigurations, warrantyStatuses, assetChecks]);

  /* ---------- CSV EXPORT: Location → Type → Brand ---------- */
  const downloadSummaryCSV = () => {
    if (tableData.length === 0) return;

    const headers = ["Location", "Asset Type", "Brand", ...assetStatuses];
    const rows: string[] = [];

    rows.push(headers.map(h => `"${h}"`).join(","));

    tableData.forEach(r => {
      const line = [
        `"${r.location}"`,
        `"${r.assetType}"`,
        `"${r.brand}"`,
        ...assetStatuses.map(st => r.counts[st]),
      ];
      rows.push(line.join(","));
    });

    const totalLine = [
      '"Grand Total"',
      '""',
      '""',
      ...assetStatuses.map(st => grandTotals[st]),
    ];
    rows.push(totalLine.join(","));

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asset-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* --------------------------------------------------------------- */
  return (
    <Card className="shadow-card">
      <CardHeader>
        {/* TITLE + RED DOWNLOAD ICON */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">
              Asset Summary ({filteredAssets.length} items)
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={downloadSummaryCSV}
              disabled={filteredAssets.length === 0}
              className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700"
              title="Download CSV"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm font-medium text-primary">
            Asset Value Recovery = Rs. {totalRecovery.toLocaleString()}
          </div>
        </div>

        {/* FILTER BAR – ALL FILTERS */}
        <div className="mt-4 overflow-x-auto">
          <div className="flex gap-2 items-end min-w-max">
            {/* Global Search */}
            <div className="space-y-1 min-w-48">
              <Label className="text-xs font-medium">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 h-7 text-xs"
                />
              </div>
            </div>

            {/* Type */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Type</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {typeFilter.length === 0 ? "All" : `${typeFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search..."
                      value={searchQueryType}
                      onChange={e => setSearchQueryType(e.target.value)}
                      onKeyDown={e => e.stopPropagation()}
                      autoFocus
                      className="h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetTypes
                      .filter(t => t.toLowerCase().includes(searchQueryType.toLowerCase()))
                      .map(t => (
                        <div key={t} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`type-${t}`}
                            checked={typeFilter.includes(t)}
                            onCheckedChange={c =>
                              setTypeFilter(p => (c ? [...p, t] : p.filter(x => x !== t)))
                            }
                          />
                          <Label htmlFor={`type-${t}`} className="text-xs cursor-pointer flex-1">
                            {t}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Brand */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Brand</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {brandFilter.length === 0 ? "All" : `${brandFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search..."
                      value={searchQueryBrand}
                      onChange={e => setSearchQueryBrand(e.target.value)}
                      onKeyDown={e => e.stopPropagation()}
                      autoFocus
                      className="h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetBrands
                      .filter(b => b.toLowerCase().includes(searchQueryBrand.toLowerCase()))
                      .map(b => (
                        <div key={b} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`brand-${b}`}
                            checked={brandFilter.includes(b)}
                            onCheckedChange={c =>
                              setBrandFilter(p => (c ? [...p, b] : p.filter(x => x !== b)))
                            }
                          />
                          <Label htmlFor={`brand-${b}`} className="text-xs cursor-pointer flex-1">
                            {b}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Status</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {statusFilter.length === 0 ? "All" : `${statusFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search..."
                      value={searchQueryStatus}
                      onChange={e => setSearchQueryStatus(e.target.value)}
                      onKeyDown={e => e.stopPropagation()}
                      autoFocus
                      className="h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetStatuses
                      .filter(s => s.toLowerCase().includes(searchQueryStatus.toLowerCase()))
                      .map(s => (
                        <div key={s} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`status-${s}`}
                            checked={statusFilter.includes(s)}
                            onCheckedChange={c =>
                              setStatusFilter(p => (c ? [...p, s] : p.filter(x => x !== s)))
                            }
                          />
                          <Label htmlFor={`status-${s}`} className="text-xs cursor-pointer flex-1">
                            {s}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Location */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Location</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {locationFilter.length === 0 ? "All" : `${locationFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search..."
                      value={searchQueryLocation}
                      onChange={e => setSearchQueryLocation(e.target.value)}
                      onKeyDown={e => e.stopPropagation()}
                      autoFocus
                      className="h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetLocations
                      .filter(l => l.toLowerCase().includes(searchQueryLocation.toLowerCase()))
                      .map(l => (
                        <div key={l} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`location-${l}`}
                            checked={locationFilter.includes(l)}
                            onCheckedChange={c =>
                              setLocationFilter(p => (c ? [...p, l] : p.filter(x => x !== l)))
                            }
                          />
                          <Label htmlFor={`location-${l}`} className="text-xs cursor-pointer flex-1">
                            {l}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Condition */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Asset Condition</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {conditionFilter.length === 0 ? "All" : `${conditionFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search..."
                      value={searchQueryCondition}
                      onChange={e => setSearchQueryCondition(e.target.value)}
                      onKeyDown={e => e.stopPropagation()}
                      autoFocus
                      className="h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetConditions
                      .filter(c => c.toLowerCase().includes(searchQueryCondition.toLowerCase()))
                      .map(c => (
                        <div key={c} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`condition-${c}`}
                            checked={conditionFilter.includes(c)}
                            onCheckedChange={chk =>
                              setConditionFilter(p => (chk ? [...p, c] : p.filter(x => x !== c)))
                            }
                          />
                          <Label htmlFor={`condition-${c}`} className="text-xs cursor-pointer flex-1">
                            {c}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Configuration */}
            <div className="space|y-1 min-w-40">
              <Label className="text-xs font-medium">Configuration</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {configFilter.length === 0 ? "All" : `${configFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search..."
                      value={searchQueryConfig}
                      onChange={e => setSearchQueryConfig(e.target.value)}
                      onKeyDown={e => e.stopPropagation()}
                      autoFocus
                      className="h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetConfigurations
                      .filter(c => c.toLowerCase().includes(searchQueryConfig.toLowerCase()))
                      .map(c => (
                        <div key={c} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`config-${c}`}
                            checked={configFilter.includes(c)}
                            onCheckedChange={chk =>
                              setConfigFilter(p => (chk ? [...p, c] : p.filter(x => x !== c)))
                            }
                          />
                          <Label htmlFor={`config-${c}`} className="text-xs cursor-pointer flex-1">
                            {c}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Warranty */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Warranty</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {warrantyFilter.length === 0 ? "All" : `${warrantyFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search..."
                      value={searchQueryWarranty}
                      onChange={e => setSearchQueryWarranty(e.target.value)}
                      onKeyDown={e => e.stopPropagation()}
                      autoFocus
                      className="h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {warrantyStatuses
                      .filter(w => w.toLowerCase().includes(searchQueryWarranty.toLowerCase()))
                      .map(w => (
                        <div key={w} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`warranty-${w}`}
                            checked={warrantyFilter.includes(w)}
                            onCheckedChange={chk =>
                              setWarrantyFilter(p => (chk ? [...p, w] : p.filter(x => x !== w)))
                            }
                          />
                          <Label htmlFor={`warranty-${w}`} className="text-xs cursor-pointer flex-1">
                            {w}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Asset Check */}
            <div className="space-y-1 min-w-40">
              <Label className="text-xs font-medium">Check</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-xs h-7 w-full justify-between">
                    {assetCheckFilter.length === 0 ? "All" : `${assetCheckFilter.length}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search..."
                      value={searchQueryAssetCheck}
                      onChange={e => setSearchQueryAssetCheck(e.target.value)}
                      onKeyDown={e => e.stopPropagation()}
                      autoFocus
                      className="h-6 text-xs"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {assetChecks
                      .filter(c => c.toLowerCase().includes(searchQueryAssetCheck.toLowerCase()))
                      .map(c => (
                        <div key={c} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`check-${c}`}
                            checked={assetCheckFilter.includes(c)}
                            onCheckedChange={chk =>
                              setAssetCheckFilter(p => (chk ? [...p, c] : p.filter(x => x !== c)))
                            }
                          />
                          <Label htmlFor={`check-${c}`} className="text-xs cursor-pointer flex-1">
                            {c}
                          </Label>
                        </div>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Date Range */}
            <div className="space-y-1 min-w-48">
              <Label className="text-xs font-medium">Date Range</Label>
              <DatePickerWithRange
                date={dateRange}
                setDate={setDateRange}
                className="h-7 text-xs"
              />
            </div>

            {/* Clear */}
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="hover:bg-destructive hover:text-destructive-foreground text-xs h-7 w-full min-w-28"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No Assets Found
            </h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters.
            </p>
          </div>
        ) : (
          <>
            {/* TABLE: Location → Type → Brand */}
            <div className="overflow-x-auto max-h-[60vh] relative">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-xs text-white sticky top-0 z-10">
                    <th className="p-2 text-left bg-blue-600">Location</th>
                    <th className="p-2 text-left bg-blue-600">Asset Type</th>
                    <th className="p-2 text-left bg-blue-600">Brand</th>
                    {assetStatuses.map(st => (
                      <th key={st} className={`p-2 text-left ${getStatusColor(st)}`}>
                        {st}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, idx) => (
                    <tr
                      key={`${row.location}-${row.assetType}-${row.brand}-${idx}`}
                      className="border-b hover:bg-muted/50"
                    >
                      <td className="p-2 text-xs">{row.location}</td>
                      <td className="p-2 text-xs">{row.assetType}</td>
                      <td className="p-2 text-xs">{row.brand}</td>
                      {assetStatuses.map(st => (
                        <td key={st} className="p-2 text-xs">
                          {row.counts[st]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold bg-gray-100">
                    <td className="p-2 text-xs" colSpan={3}>
                      Grand Total
                    </td>
                    {assetStatuses.map(st => (
                      <td key={st} className="p-2 text-xs">
                        {grandTotals[st]}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                {Math.min(currentPage * rowsPerPage, tableData.length)} of {tableData.length} rows
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  &lt;
                </Button>
                {startPage > 1 && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} className="h-8 w-8 p-0">1</Button>
                    {startPage > 2 && <span className="text-sm px-2">...</span>}
                  </>
                )}
                {pageNumbers.map(p => (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(p)}
                    className={`h-8 w-8 p-0 ${currentPage === p ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {p}
                  </Button>
                ))}
                {endPage < totalPages && (
                  <>
                    {endPage < totalPages - 1 && <span className="text-sm px-2">...</span>}
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} className="h-8 w-8 p-0">
                      {totalPages}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  &gt;
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryView;