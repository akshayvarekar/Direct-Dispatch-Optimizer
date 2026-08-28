import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Download,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Play,
  ArrowRight,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { ScenarioParameters, ScenarioRunResult } from '../types';

interface ScenarioPerformanceTableProps {
  scenarios: ScenarioParameters[];
  allResults: ScenarioRunResult[];
  activeScenarioName: string;
  onSelectScenario: (name: string) => void;
  onRunAll?: () => void;
  isRunningAll?: boolean;
}

interface ScenarioRowData {
  name: string;
  horizon: number;
  milkRuns: string;
  capCons: string;
  minTruckload: number;
  hasResult: boolean;
  totalCostSavings: number;
  transportSavings: number;
  whSavings: number;
  ddPallets: number;
  fillRateLossPct: number;
  eligibleOrdersPct: number;
  avgCapacityUtilPct: number;
  co2SavedKg: number;
  isActive: boolean;
}

export const ScenarioPerformanceTable: React.FC<ScenarioPerformanceTableProps> = ({
  scenarios,
  allResults,
  activeScenarioName,
  onSelectScenario,
  onRunAll,
  isRunningAll = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof ScenarioRowData>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Map results by scenario name
  const resultMap = new Map<string, ScenarioRunResult>();
  allResults.forEach(r => resultMap.set(r.scenarioName, r));

  const tableData: ScenarioRowData[] = scenarios.map(scn => {
    const res = resultMap.get(scn.ScnName);
    const savings = res?.totalCostSavings ?? (scn.totalCostSavings ?? 0);
    const transportSavings = res?.totalTransportSavings ?? Math.round(savings * 0.65);
    const whSavings = res?.totalWHSavings ?? Math.round(savings * 0.35);
    const ddPallets = res?.totalDDPallets ?? 0;
    const fillRateLossPct = res?.fillRateLossPct ?? (scn.fillRateLossPct ?? 0);
    const eligibleOrdersPct = res?.eligibleOrdersPct ?? (scn.eligibleOrdersPct ?? 0);
    const avgCapacityUtilPct = res?.overallAvgCapacityUtilPct ?? 0;
    const co2SavedKg = res?.totalCO2SavedKg ?? Math.round(ddPallets * 12.5);

    return {
      name: scn.ScnName,
      horizon: scn.OrderCombHorizon,
      milkRuns: scn.MilkRuns,
      capCons: scn.UseWHCapacityCons,
      minTruckload: scn.MinTruckload,
      hasResult: !!res || !!scn.hasResult,
      totalCostSavings: Math.round(savings),
      transportSavings: Math.round(transportSavings),
      whSavings: Math.round(whSavings),
      ddPallets: Math.round(ddPallets),
      fillRateLossPct: Number(fillRateLossPct.toFixed(1)),
      eligibleOrdersPct: Number(eligibleOrdersPct.toFixed(1)),
      avgCapacityUtilPct: Number(avgCapacityUtilPct.toFixed(1)),
      co2SavedKg: Math.round(co2SavedKg),
      isActive: scn.ScnName === activeScenarioName,
    };
  });

  const handleSort = (field: keyof ScenarioRowData) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'name' ? true : false);
    }
  };

  const filtered = tableData
    .filter(row => {
      // Quick filter
      if (filterType === 'MILK_YES' && row.milkRuns !== 'YES') return false;
      if (filterType === 'CAP_YES' && row.capCons !== 'YES') return false;
      if (filterType === 'CAP_NO' && row.capCons === 'YES') return false;
      if (filterType === 'HORIZON_3_7' && row.horizon === 0) return false;

      // Text search
      const query = searchTerm.toLowerCase();
      return (
        row.name.toLowerCase().includes(query) ||
        `${row.horizon} days`.includes(query) ||
        `milk ${row.milkRuns}`.toLowerCase().includes(query) ||
        `cap ${row.capCons}`.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortAsc ? aVal - bVal : bVal - aVal;
      }
      return sortAsc
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  const handleExportCsv = () => {
    const headers = [
      'Scenario_Name',
      'Order_Comb_Horizon_Days',
      'Milk_Runs_25km',
      'WH_Capacity_Constraint',
      'Min_Truckload_Pallets',
      'DD_Pallets',
      'Fill_Rate_Loss_Pct',
      'Transport_Savings_USD',
      'WH_Savings_USD',
      'Total_Net_Savings_USD',
      'CO2_Saved_Kg',
    ];

    const rows = filtered.map(r => [
      r.name,
      r.horizon,
      r.milkRuns,
      r.capCons,
      r.minTruckload,
      r.ddPallets,
      r.fillRateLossPct,
      r.transportSavings,
      r.whSavings,
      r.totalCostSavings,
      r.co2SavedKg,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Scenario_Benchmarking_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Aggregates
  const bestSavings = Math.max(...tableData.map(d => d.totalCostSavings), 0);
  const avgSavings = Math.round(tableData.reduce((sum, d) => sum + d.totalCostSavings, 0) / (tableData.length || 1));
  const maxDDPallets = Math.max(...tableData.map(d => d.ddPallets), 0);

  return (
    <div className="bg-white border border-[#e8e2d8] rounded-xl overflow-hidden shadow-2xs">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-[#eee7dc] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#fdfcfb]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#fbf7f0] flex items-center justify-center text-[#b45309] border border-[#eee4d6] shadow-2xs">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Scenario-Wise Performance Report</h2>
              <span className="text-[11px] font-semibold bg-[#f5f0e6] text-[#78350f] border border-[#e2d8ca] px-2 py-0.5 rounded-full">
                12 Policy Runs
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative benchmark of all supply chain policy configurations, truckload rules, and financial yields
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search scenario or policy..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border border-[#e0d8cc] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 focus:border-[#b45309] w-44 sm:w-56 shadow-2xs"
            />
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 bg-white hover:bg-[#faf7f2] text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e0d8cc] transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#b45309]" />
            <span>Export Report CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Bar */}
      <div className="px-4 sm:px-5 py-2.5 bg-[#faf8f4] border-b border-[#eee7dc] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Filter:
          </span>
          {[
            { id: 'ALL', label: `All Scenarios (${tableData.length})` },
            { id: 'MILK_YES', label: 'Milk Runs = YES' },
            { id: 'CAP_YES', label: 'WH Cap Enforced' },
            { id: 'CAP_NO', label: 'Unconstrained' },
            { id: 'HORIZON_3_7', label: 'Horizon ≥ 3 Days' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                filterType === f.id
                  ? 'bg-[#b45309] text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-[#f2ece2] border border-[#e0d8cc]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* High-level Summary Pill */}
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-600 font-medium">
          <div>
            Best Net Savings: <span className="font-bold text-emerald-700">${bestSavings.toLocaleString()}</span>
          </div>
          <span className="text-slate-300">•</span>
          <div>
            Average Net Savings: <span className="font-bold text-slate-800">${avgSavings.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-[#faf8f4] text-[#78350f] uppercase tracking-wider text-[10px] font-bold border-b border-[#eee7dc]">
            <tr>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>Scenario Policy</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('horizon')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Horizon</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('milkRuns')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Milk Runs</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('capCons')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>WH Cap</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('ddPallets')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>DD Pallets</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('fillRateLossPct')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Fill Loss %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('transportSavings')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Transport Sav.</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('whSavings')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>WH Sav.</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('totalCostSavings')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1 font-extrabold text-[#78350f]">
                  <span>Total Net Savings</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('co2SavedKg')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>CO₂ Saved</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ebe1]">
            {filtered.map(row => {
              const isBest = row.totalCostSavings === bestSavings;
              return (
                <tr
                  key={row.name}
                  onClick={() => onSelectScenario(row.name)}
                  className={`hover:bg-[#faf7f2] transition cursor-pointer group ${
                    row.isActive ? 'bg-[#fcf9f4] font-medium' : ''
                  }`}
                >
                  {/* Scenario Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {row.isActive ? (
                        <div className="w-2 h-2 rounded-full bg-[#b45309] shrink-0"></div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-[#b45309] transition shrink-0"></div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${row.isActive ? 'text-[#b45309]' : 'text-slate-900'}`}>
                            {row.name}
                          </span>
                          {row.isActive && (
                            <span className="text-[10px] font-bold bg-[#b45309] text-white px-1.5 py-0.2 rounded shadow-2xs">
                              Active
                            </span>
                          )}
                          {isBest && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded">
                              Optimal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Horizon */}
                  <td className="py-3 px-3 text-center">
                    <span className="bg-[#faf8f4] text-slate-700 px-2 py-0.5 rounded border border-[#eee7dc] font-semibold text-[11px]">
                      {row.horizon} Days
                    </span>
                  </td>

                  {/* Milk Runs */}
                  <td className="py-3 px-3 text-center">
                    {row.milkRuns === 'YES' ? (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[10px]">
                        YES (25km)
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium">
                        NO
                      </span>
                    )}
                  </td>

                  {/* WH Cap */}
                  <td className="py-3 px-3 text-center">
                    {row.capCons === 'YES' ? (
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-bold text-[10px]">
                        YES (Cap)
                      </span>
                    ) : (
                      <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-medium text-[10px]">
                        NO (Free)
                      </span>
                    )}
                  </td>

                  {/* DD Pallets */}
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                    {row.ddPallets.toLocaleString()}
                  </td>

                  {/* Fill Loss % */}
                  <td className="py-3 px-3 text-right font-mono">
                    <span
                      className={`px-1.5 py-0.5 rounded font-semibold text-[11px] ${
                        row.fillRateLossPct === 0
                          ? 'text-emerald-700 bg-emerald-50'
                          : row.fillRateLossPct < 30
                          ? 'text-slate-700 bg-slate-50'
                          : 'text-amber-800 bg-amber-50'
                      }`}
                    >
                      {row.fillRateLossPct}%
                    </span>
                  </td>

                  {/* Transport Savings */}
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    ${row.transportSavings.toLocaleString()}
                  </td>

                  {/* WH Savings */}
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    ${row.whSavings.toLocaleString()}
                  </td>

                  {/* Total Net Savings */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    <span className="text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/60 inline-block font-extrabold text-xs">
                      ${row.totalCostSavings.toLocaleString()}
                    </span>
                  </td>

                  {/* CO2 Saved */}
                  <td className="py-3 px-3 text-right font-mono text-slate-600 text-[11px]">
                    {(row.co2SavedKg / 1000).toFixed(1)}k kg
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-center">
                    {row.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#b45309] bg-[#f5f0e6] px-2.5 py-1 rounded-md border border-[#e2d8ca]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selected
                      </span>
                    ) : (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectScenario(row.name);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 hover:text-[#b45309] bg-white hover:bg-[#faf7f2] px-2.5 py-1 rounded-md border border-[#e0d8cc] transition cursor-pointer shadow-2xs"
                      >
                        <span>Activate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center text-slate-500 text-xs">
          No scenarios match your search/filter criteria.
        </div>
      )}
    </div>
  );
};
