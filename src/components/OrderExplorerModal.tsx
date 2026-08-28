import React, { useState, useMemo, useEffect } from 'react';
import { OrderEvaluationDetail } from '../types';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Package,
} from 'lucide-react';

interface OrderExplorerProps {
  orders: OrderEvaluationDetail[];
  minTruckload: number;
  scenarioName?: string;
  selectedFactoryId?: string;
}

export const OrderExplorer: React.FC<OrderExplorerProps> = ({
  orders,
  minTruckload,
  scenarioName = 'Current_Scenario',
  selectedFactoryId = 'ALL',
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'DD' | 'TRADITIONAL' | 'ELIGIBLE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFactory, setSelectedFactory] = useState<string>(selectedFactoryId);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortField, setSortField] = useState<keyof OrderEvaluationDetail>('salesOrder');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    setSelectedFactory(selectedFactoryId);
    setCurrentPage(1);
  }, [selectedFactoryId]);

  // Extract unique factories for filter dropdown
  const uniqueFactories = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => {
      if (o.assignedFactoryId) set.add(o.assignedFactoryId);
    });
    return Array.from(set).sort();
  }, [orders]);

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => {
        // Status filter
        if (filterType === 'DD' && !o.dispatchedDD) return false;
        if (filterType === 'TRADITIONAL' && o.dispatchedDD) return false;
        if (filterType === 'ELIGIBLE' && !o.isEligible) return false;

        // Factory filter
        if (selectedFactory !== 'ALL' && o.assignedFactoryId !== selectedFactory) return false;

        // Search text
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const match =
            o.salesOrder.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.customerId.toLowerCase().includes(q) ||
            o.skuName.toLowerCase().includes(q) ||
            o.skuId.toLowerCase().includes(q) ||
            o.assignedFactoryId.toLowerCase().includes(q) ||
            o.assignedDCId.toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        const strA = String(valA || '');
        const strB = String(valB || '');
        return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
  }, [orders, filterType, selectedFactory, searchTerm, sortField, sortAsc]);

  // Aggregate statistics for summary cards
  const stats = useMemo(() => {
    const totalLines = orders.length;
    const ddLines = orders.filter(o => o.dispatchedDD).length;
    const tradLines = totalLines - ddLines;
    const totalPallets = orders.reduce((sum, o) => sum + o.qtyPallets, 0);
    const ddPallets = orders.reduce((sum, o) => sum + (o.ddDispatchedPallets || 0), 0);
    const totalSavings = orders.reduce((sum, o) => sum + (o.totalOrderSavings || 0), 0);
    const totalCo2 = orders.reduce((sum, o) => sum + (o.co2SavedKg || 0), 0);

    return {
      totalLines,
      ddLines,
      tradLines,
      ddLinePct: totalLines > 0 ? Math.round((ddLines / totalLines) * 100) : 0,
      totalPallets,
      ddPallets,
      ddPalletPct: totalPallets > 0 ? Math.round((ddPallets / totalPallets) * 100) : 0,
      totalSavings: Math.round(totalSavings),
      avgSavingsPerDDPallet: ddPallets > 0 ? (totalSavings / ddPallets).toFixed(2) : '0.00',
      totalCo2: Math.round(totalCo2),
    };
  }, [orders]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Sort handler
  const handleSort = (field: keyof OrderEvaluationDetail) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // CSV download function
  const handleDownloadCSV = () => {
    const headers = [
      'Sales_Order',
      'Line_Item',
      'Customer_ID',
      'Customer_Name',
      'SKU_ID',
      'SKU_Name',
      'Requested_Delivery_Date',
      'Order_Qty_Pallets',
      'Group_Combined_Qty_Pallets',
      'Assigned_Factory_ID',
      'Assigned_Factory_Name',
      'Assigned_DC_ID',
      'Assigned_DC_Name',
      'Alpha_Factor_Policy',
      'Primary_Dist_KM',
      'Secondary_Dist_KM',
      'Traditional_Total_Dist_KM',
      'DD_Dist_KM',
      'PCPP_Per_Pallet',
      'SCPP_Per_Pallet',
      'DDCPP_Per_Pallet',
      'DC_WH_Cost_Per_Pallet',
      'Factory_WH_Cost_Per_Pallet',
      'Unit_WH_Savings_Per_Pallet',
      'Unit_Transport_Savings_Per_Pallet',
      'Unit_Total_Savings_Per_Pallet',
      'DD_Eligibility_Status',
      'Dispatched_Direct_Flag',
      'Dispatched_DD_Pallets',
      'Traditional_Loss_Pallets',
      'Total_Line_Savings_USD',
      'Estimated_CO2_Saved_KG',
      'Dispatch_Decision_Rationale',
    ];

    const escapeCsv = (str: any) => {
      const s = String(str ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = filteredOrders.map(o => {
      const tradDist = Math.round(o.primaryDistKm + o.secondaryDistKm);
      const reason = o.dispatchedDD
        ? `Dispatched DD: Combined Qty (${o.groupCombinedQty ?? o.qtyPallets}p) >= MinTruckload (${minTruckload}p) & Transport/WH cost benefit positive`
        : o.rejectionReason || 'Routed Traditional DC Route';

      return [
        escapeCsv(o.salesOrder),
        o.lineItem,
        escapeCsv(o.customerId),
        escapeCsv(o.customerName),
        escapeCsv(o.skuId),
        escapeCsv(o.skuName),
        escapeCsv(o.deliveryDate),
        o.qtyPallets,
        o.groupCombinedQty ?? o.qtyPallets,
        escapeCsv(o.assignedFactoryId),
        escapeCsv(o.assignedFactoryName),
        escapeCsv(o.assignedDCId),
        escapeCsv(o.assignedDCName),
        o.alpha ?? 0.5,
        o.primaryDistKm,
        o.secondaryDistKm,
        tradDist,
        o.ddDistKm,
        o.pcpp,
        o.scpp,
        o.ddcpp,
        o.dcWhCost ?? 0,
        o.factoryWhCost ?? 0,
        o.unitWhSavings,
        o.unitTransportSavings,
        o.unitTotalSavings ?? Math.round((o.unitTransportSavings + o.unitWhSavings) * 100) / 100,
        o.isEligible ? 'YES' : 'NO',
        o.dispatchedDD ? 'YES' : 'NO',
        o.ddDispatchedPallets,
        o.lossPallets,
        o.totalOrderSavings,
        o.co2SavedKg,
        escapeCsv(reason),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${scenarioName}_Order_Level_Diagnostics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* 1. Diagnostic Summary Header Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#e8e2d8] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Evaluated Orders</span>
            <Package className="w-4 h-4 text-[#b45309]" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {stats.totalLines.toLocaleString()} <span className="text-xs font-normal text-slate-500">lines</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.totalPallets.toLocaleString()} total pallets requested
          </div>
        </div>

        <div className="bg-white border border-[#e8e2d8] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>Direct Dispatched</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-800 mt-1">
            {stats.ddLines.toLocaleString()}{' '}
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {stats.ddLinePct}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            <span className="font-bold text-slate-800">{stats.ddPallets.toLocaleString()}</span> DD pallets ({stats.ddPalletPct}%)
          </div>
        </div>

        <div className="bg-white border border-[#e8e2d8] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
            <span>Traditional Route</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-800 mt-1">
            {stats.tradLines.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">
              ({100 - stats.ddLinePct}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {(stats.totalPallets - stats.ddPallets).toLocaleString()} pallets via DC
          </div>
        </div>

        <div className="bg-white border border-[#e8e2d8] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#78350f] text-xs font-semibold">
            <span>Total Net Savings</span>
            <TrendingUp className="w-4 h-4 text-[#b45309]" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">
            ${stats.totalSavings.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-800 font-bold mt-0.5">
            ${stats.avgSavingsPerDDPallet}/pal DD · {stats.totalCo2.toLocaleString()} kg CO₂
          </div>
        </div>
      </div>

      {/* 2. Main Order Table Container */}
      <div className="bg-white border border-[#e8e2d8] rounded-xl overflow-hidden shadow-2xs">
        {/* Action Bar */}
        <div className="p-4 sm:p-5 border-b border-[#eee7dc] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#fdfcfb]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#fbf7f0] flex items-center justify-center text-[#b45309] border border-[#eee4d6] shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Sales Order Diagnostic Audit
                </h2>
                <span className="bg-[#f5f0e6] text-[#78350f] font-mono text-[11px] px-2 py-0.5 rounded border border-[#e2d8ca] font-bold">
                  {filteredOrders.length} lines
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detailed line-item routing economics, distance calculation, warehouse handling, alpha policy, and dispatch decisions.
              </p>
            </div>
          </div>

          {/* Controls & Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Tabs */}
            <div className="flex bg-[#f6f1e8] p-0.5 rounded-lg border border-[#e0d7cb] text-xs">
              <button
                onClick={() => {
                  setFilterType('ALL');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  filterType === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({orders.length})
              </button>
              <button
                onClick={() => {
                  setFilterType('DD');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  filterType === 'DD'
                    ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                DD ({stats.ddLines})
              </button>
              <button
                onClick={() => {
                  setFilterType('TRADITIONAL');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  filterType === 'TRADITIONAL'
                    ? 'bg-slate-700 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Traditional ({stats.tradLines})
              </button>
              <button
                onClick={() => {
                  setFilterType('ELIGIBLE');
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  filterType === 'ELIGIBLE'
                    ? 'bg-[#b45309] text-white font-bold shadow-2xs'
                    : 'text-[#78350f] hover:text-slate-900'
                }`}
              >
                ≥{minTruckload}p Eligible
              </button>
            </div>

            {/* Plant Dropdown */}
            {uniqueFactories.length > 1 && (
              <select
                value={selectedFactory}
                onChange={e => {
                  setSelectedFactory(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#e0d8cc] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Plants ({uniqueFactories.length})</option>
                {uniqueFactories.map(f => (
                  <option key={f} value={f}>
                    Plant {f}
                  </option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order, customer, SKU..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#e0d8cc] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 w-44 sm:w-56 shadow-2xs"
              />
            </div>

            {/* Prominent Download CSV Button */}
            <button
              onClick={handleDownloadCSV}
              id="btn-download-order-diagnostics-csv"
              className="flex items-center gap-1.5 bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition active:scale-98 cursor-pointer shrink-0"
              title="Download full line-item level diagnostic dataset with all math columns as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* 3. Orders Diagnostic Table */}
        <div className="overflow-x-auto max-h-[580px]">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#faf8f4] text-[#78350f] uppercase tracking-wider text-[10px] font-bold border-b border-[#eee7dc] sticky top-0 z-10">
              <tr>
                <th
                  onClick={() => handleSort('salesOrder')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Order & Line</span>
                    <ArrowUpDown className="w-3 h-3 text-[#b45309]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('customerName')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Customer & Delivery</span>
                    <ArrowUpDown className="w-3 h-3 text-[#b45309]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('skuName')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>SKU & Volume</span>
                    <ArrowUpDown className="w-3 h-3 text-[#b45309]" />
                  </div>
                </th>
                <th className="py-3 px-3">
                  <span>Plant / DC / Policy (α)</span>
                </th>
                <th className="py-3 px-3">
                  <span>Distances (km)</span>
                </th>
                <th className="py-3 px-3">
                  <span>Transport ($/p)</span>
                </th>
                <th className="py-3 px-3">
                  <span>WH Costs ($/p)</span>
                </th>
                <th
                  onClick={() => handleSort('dispatchedDD')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Routing Decision</span>
                    <ArrowUpDown className="w-3 h-3 text-[#b45309]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalOrderSavings')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 select-none"
                >
                  <div className="flex items-center justify-end gap-1 text-[#78350f] font-bold">
                    <span>Line Savings ($)</span>
                    <ArrowUpDown className="w-3 h-3 text-[#b45309]" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3ede3] font-medium">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, idx) => (
                  <tr
                    key={`${order.salesOrder}-${order.lineItem}-${idx}`}
                    className={`hover:bg-[#faf7f2] transition ${
                      order.dispatchedDD ? 'bg-emerald-50/20' : ''
                    }`}
                  >
                    {/* Order ID & Line */}
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 font-mono flex items-center gap-1">
                        <span>{order.salesOrder}</span>
                        <span className="text-[10px] text-slate-600 bg-[#f0ebe1] px-1 rounded font-semibold">
                          #{order.lineItem}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{order.deliveryDate}</div>
                    </td>

                    {/* Customer */}
                    <td className="py-2.5 px-3">
                      <div
                        className="font-bold text-slate-900 truncate max-w-[140px]"
                        title={order.customerName}
                      >
                        {order.customerName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {order.customerId}
                      </div>
                    </td>

                    {/* SKU & Volume */}
                    <td className="py-2.5 px-3">
                      <div
                        className="font-semibold text-slate-800 truncate max-w-[130px]"
                        title={order.skuName}
                      >
                        {order.skuName}
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1">
                        <span className="font-bold text-slate-900">{order.qtyPallets}p</span>
                        <span className="text-slate-400">
                          (Grp: {order.groupCombinedQty ?? order.qtyPallets}p)
                        </span>
                      </div>
                    </td>

                    {/* Plant / DC / Alpha */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-mono font-bold">
                          {order.assignedFactoryId}
                        </span>
                        <span className="text-slate-400 text-[10px]">→</span>
                        <span className="text-slate-600 font-mono text-[11px]">
                          {order.assignedDCId}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <span>Policy α:</span>
                        <span className="font-bold font-mono text-[#78350f] bg-[#f5f0e6] px-1 py-0.2 rounded border border-[#e2d8ca]">
                          {order.alpha !== undefined ? order.alpha.toFixed(2) : '0.50'}
                        </span>
                      </div>
                    </td>

                    {/* Distances */}
                    <td className="py-2.5 px-3 text-[11px] text-slate-600 font-mono">
                      <div>
                        <span className="text-slate-400 font-sans">Trad: </span>
                        <span>{Math.round(order.primaryDistKm + order.secondaryDistKm)} km</span>
                      </div>
                      <div className="text-emerald-800 font-bold">
                        <span className="text-emerald-700 font-sans">DD: </span>
                        <span>{Math.round(order.ddDistKm)} km</span>
                      </div>
                    </td>

                    {/* Transport Costs */}
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-600">
                      <div>
                        PCPP: ${order.pcpp.toFixed(1)} | SCPP: ${order.scpp.toFixed(1)}
                      </div>
                      <div className="text-slate-900 font-bold">
                        DDCPP: ${order.ddcpp.toFixed(1)}
                      </div>
                    </td>

                    {/* WH Costs */}
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-600">
                      <div>
                        DC: ${order.dcWhCost ? order.dcWhCost.toFixed(1) : '-'} | Fac: $
                        {order.factoryWhCost ? order.factoryWhCost.toFixed(1) : '-'}
                      </div>
                      <div className="text-emerald-800 font-bold">
                        WH Sav: +${order.unitWhSavings.toFixed(1)}/p
                      </div>
                    </td>

                    {/* Decision */}
                    <td className="py-2.5 px-3">
                      {order.dispatchedDD ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Direct ({order.ddDispatchedPallets}p)
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                            title={order.rejectionReason}
                          >
                            <XCircle className="w-3 h-3 text-slate-400" />
                            DC Route
                          </span>
                          {order.rejectionReason && (
                            <div
                              className="text-[10px] text-slate-500 truncate max-w-[130px] mt-0.5"
                              title={order.rejectionReason}
                            >
                              {order.rejectionReason}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Total Savings */}
                    <td className="py-2.5 px-4 text-right">
                      {order.dispatchedDD ? (
                        <div className="font-black text-slate-900 font-mono text-sm">
                          +${Math.round(order.totalOrderSavings).toLocaleString()}
                          <div className="text-[10px] text-emerald-800 font-bold font-sans">
                            +{order.co2SavedKg} kg CO₂
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">$0</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination Controls */}
        <div className="p-3 sm:p-4 border-t border-[#eee7dc] bg-[#faf8f4] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>
              Showing {filteredOrders.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
              {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length}{' '}
              matching orders
            </span>
            <span className="text-[#ded5c7]">|</span>
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-[#e0d8cc] rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded border border-[#e0d8cc] bg-white text-slate-700 hover:bg-[#faf7f2] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded border border-[#e0d8cc] bg-white text-slate-700 hover:bg-[#faf7f2] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
