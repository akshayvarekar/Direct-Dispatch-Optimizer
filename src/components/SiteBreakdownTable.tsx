import React, { useState } from 'react';
import {
  Building2,
  Download,
  Search,
  ArrowUpDown,
  Info,
} from 'lucide-react';
import { FactorySiteResult } from '../types';

interface SiteBreakdownTableProps {
  siteResults: FactorySiteResult[];
  scenarioName: string;
  useWHCapacityCons: boolean;
  selectedFactoryId?: string;
}

export const SiteBreakdownTable: React.FC<SiteBreakdownTableProps> = ({
  siteResults,
  scenarioName,
  useWHCapacityCons,
  selectedFactoryId = 'ALL',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof FactorySiteResult>('totalSavings');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: keyof FactorySiteResult) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filtered = siteResults
    .filter(r => {
      const matchesFactoryFilter = selectedFactoryId === 'ALL' || r.factoryId === selectedFactoryId;
      const matchesSearch =
        r.factoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.factoryId.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFactoryFilter && matchesSearch;
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

  const totalDDPallets = filtered.reduce((sum, r) => sum + r.ddPallets, 0);
  const totalSavings = filtered.reduce((sum, r) => sum + r.totalSavings, 0);
  const totalLosses = filtered.reduce((sum, r) => sum + r.lossesPallets, 0);
  const totalCO2 = filtered.reduce((sum, r) => sum + r.co2SavedKg, 0);

  const handleDownloadCsv = () => {
    window.location.href = `/api/export/csv/${encodeURIComponent(scenarioName)}`;
  };

  return (
    <div className="bg-white border border-[#e8e2d8] rounded-xl overflow-hidden shadow-2xs">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-[#eee7dc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fdfcfb]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#fbf7f0] flex items-center justify-center text-[#b45309] border border-[#eee4d6]">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Site-wise Factory Performance</h2>
              {selectedFactoryId !== 'ALL' && (
                <span className="text-[10px] bg-[#ede7dc] text-[#5e4f41] px-2 py-0.5 rounded font-bold">
                  Filtered: {selectedFactoryId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Direct dispatch volume, fill-rate loss, godown capacity utilization & cost savings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search site..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border border-[#e0d8cc] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 focus:border-[#b45309] w-36 sm:w-48 shadow-2xs"
            />
          </div>

          {/* Download CSV button */}
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 bg-white hover:bg-[#faf7f2] text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#e0d8cc] transition cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#b45309]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-[#faf8f4] text-[#78350f] uppercase tracking-wider text-[10px] font-bold border-b border-[#eee7dc]">
            <tr>
              <th
                onClick={() => handleSort('factoryName')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>Factory Site</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('capacityPallets')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Godown Cap (p)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('ddOrdersServed')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>DD Orders</span>
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
                onClick={() => handleSort('lossesPallets')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Losses (p)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('fillRateLossPct')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Fill-Rate Loss %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('avgCapacityUtilPct')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Avg Util %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('maxCapacityUtilPct')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Peak Util %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('totalSavings')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1 text-[#78350f] font-bold">
                  <span>Net Savings ($)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('co2SavedKg')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900 text-right"
              >
                <div className="flex items-center justify-end gap-1 text-emerald-800 font-bold">
                  <span>CO₂ Saved</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3ede3] font-medium">
            {filtered.map(row => {
              const isHighLoss = row.fillRateLossPct > 20;
              const isHighUtil = row.avgCapacityUtilPct > 75;
              const isPeakBinding = row.maxCapacityUtilPct >= 99.9;

              return (
                <tr key={row.factoryId} className="hover:bg-[#faf7f2] transition">
                  {/* Factory Name */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{row.factoryName}</div>
                    <div className="text-[11px] font-mono text-[#8c7b6b] font-semibold">{row.factoryId}</div>
                  </td>

                  {/* Godown Capacity */}
                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {row.capacityPallets.toLocaleString()}
                  </td>

                  {/* DD Orders Served */}
                  <td className="py-3 px-3 text-right">
                    <span className="bg-[#f5f0e6] text-[#5e4f41] border border-[#e2d8ca] px-2 py-0.5 rounded font-bold">
                      {row.ddOrdersServed}
                    </span>
                  </td>

                  {/* DD Pallets */}
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {row.ddPallets.toLocaleString()}
                  </td>

                  {/* Losses Pallets */}
                  <td className="py-3 px-3 text-right text-slate-500 font-mono">
                    {row.lossesPallets.toLocaleString()}
                  </td>

                  {/* Fill-Rate Loss % */}
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        isHighLoss
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : row.fillRateLossPct > 5
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {row.fillRateLossPct}%
                    </span>
                  </td>

                  {/* Avg Capacity Util % */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-2 bg-[#ece5da] rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full ${
                            isHighUtil
                              ? 'bg-amber-500'
                              : 'bg-[#b45309]'
                          }`}
                          style={{ width: `${Math.min(100, row.avgCapacityUtilPct)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700">{row.avgCapacityUtilPct}%</span>
                    </div>
                  </td>

                  {/* Peak Capacity Util % */}
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        isPeakBinding
                          ? 'bg-rose-100 text-rose-900 border border-rose-300'
                          : row.maxCapacityUtilPct > 80
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                      title={`Peak BoF Stock: ${Math.round(row.maxCapacityUtilPct * row.capacityPallets / 100).toLocaleString()} / ${row.capacityPallets.toLocaleString()} pallets`}
                    >
                      {row.maxCapacityUtilPct}%
                    </span>
                  </td>

                  {/* Total Savings ($) */}
                  <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                    ${Math.round(row.totalSavings).toLocaleString()}
                  </td>

                  {/* CO2 Saved */}
                  <td className="py-3 px-4 text-right text-emerald-800 font-mono text-[11px] font-bold">
                    {row.co2SavedKg >= 1000
                      ? `${(row.co2SavedKg / 1000).toFixed(2)} t`
                      : `${Math.round(row.co2SavedKg)} kg`}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Table Summary Footer */}
          <tfoot className="bg-[#faf8f4] font-bold text-xs border-t-2 border-[#e0d7cb] text-slate-900">
            <tr>
              <td className="py-3 px-4">Network Total ({filtered.length} Plants)</td>
              <td className="py-3 px-3 text-right font-mono text-slate-500">—</td>
              <td className="py-3 px-3 text-right text-[#78350f] font-mono">
                {filtered.reduce((s, r) => s + r.ddOrdersServed, 0)}
              </td>
              <td className="py-3 px-3 text-right text-slate-900 font-mono">
                {totalDDPallets.toLocaleString()} p
              </td>
              <td className="py-3 px-3 text-right text-slate-600 font-mono">
                {totalLosses.toLocaleString()} p
              </td>
              <td className="py-3 px-3 text-right font-mono text-amber-900">
                {totalDDPallets + totalLosses > 0
                  ? `${((totalLosses / (totalDDPallets + totalLosses)) * 100).toFixed(1)}%`
                  : '0%'}
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-600">
                {filtered.length > 0
                  ? `${Math.round(filtered.reduce((s, r) => s + r.avgCapacityUtilPct, 0) / filtered.length * 10) / 10}%`
                  : '—'}
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate-600">
                {useWHCapacityCons ? 'Enforced' : 'Unconstrained'}
              </td>
              <td className="py-3 px-4 text-right text-slate-900 font-black text-sm">
                ${Math.round(totalSavings).toLocaleString()}
              </td>
              <td className="py-3 px-4 text-right text-emerald-800 font-mono">
                {totalCO2 >= 1000 ? `${(totalCO2 / 1000).toFixed(2)} t` : `${Math.round(totalCO2)} kg`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!useWHCapacityCons && (
        <div className="p-3 bg-[#fdfcfb] border-t border-[#eee7dc] text-[11px] text-slate-600 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#b45309] shrink-0" />
          <span>
            Note: In this scenario, <code className="text-slate-800 font-mono bg-white px-1 py-0.2 rounded border border-[#e0d8cc]">UseWHCapacityCons=NO</code>, so average capacity utilization % is shown for informational visibility.
          </span>
        </div>
      )}
    </div>
  );
};
