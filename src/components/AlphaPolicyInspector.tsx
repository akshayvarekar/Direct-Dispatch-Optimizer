import React, { useState, useEffect } from 'react';
import { Sliders, Search, Building2, CheckCircle2 } from 'lucide-react';
import { AlphaEntry, FactorySiteResult } from '../types';

interface AlphaPolicyInspectorProps {
  alphaVector: AlphaEntry[];
  siteResults?: FactorySiteResult[];
  scenarioName: string;
  selectedFactoryId?: string;
}

export const AlphaPolicyInspector: React.FC<AlphaPolicyInspectorProps> = ({
  alphaVector = [],
  siteResults = [],
  selectedFactoryId = 'ALL',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFactoryFilter, setSelectedFactoryFilter] = useState<string>(selectedFactoryId);

  useEffect(() => {
    setSelectedFactoryFilter(selectedFactoryId);
  }, [selectedFactoryId]);

  const filteredAlphas = alphaVector.filter(a => {
    const matchText =
      a.skuId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.skuName && a.skuName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      a.factoryId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFactory =
      selectedFactoryFilter === 'ALL' || a.factoryId === selectedFactoryFilter;
    return matchText && matchFactory;
  });

  const avgAlpha =
    filteredAlphas.length > 0
      ? (filteredAlphas.reduce((sum, a) => sum + a.alpha, 0) / filteredAlphas.length).toFixed(3)
      : '0.000';

  const highAlphaCount = filteredAlphas.filter(a => a.alpha >= 0.7).length;
  const zeroAlphaCount = filteredAlphas.filter(a => a.alpha === 0).length;

  // Extract unique factories if siteResults not passed
  const factoryList = siteResults.length > 0
    ? siteResults.map(s => ({ id: s.factoryId, name: s.factoryName }))
    : Array.from(new Set(alphaVector.map(a => a.factoryId))).map(id => ({ id, name: id }));

  return (
    <div className="bg-white border border-[#e8e2d8] rounded-xl overflow-hidden shadow-2xs">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#eee7dc] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fdfcfb]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#fbf7f0] flex items-center justify-center text-[#b45309] border border-[#eee4d6]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Optimized Alpha Stock Split Policies (α)
              </h2>
              <span className="text-[11px] bg-[#f5f0e6] text-[#78350f] border border-[#e2d8ca] px-2 py-0.5 rounded-full font-mono font-semibold">
                {filteredAlphas.length} Policies
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Optimal fraction of replenishment STO retained at Factory BoF Godown vs shipped to DC
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Factory filter dropdown */}
          <select
            value={selectedFactoryFilter}
            onChange={e => setSelectedFactoryFilter(e.target.value)}
            className="bg-white border border-[#e0d8cc] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 font-semibold cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Factories</option>
            {factoryList.map(f => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white border border-[#e0d8cc] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b45309]/20 w-36 sm:w-44 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Metric summary banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#faf8f4] border-b border-[#eee7dc] text-xs">
        <div className="bg-white p-2.5 rounded-lg border border-[#eee7dc] flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Network Avg α</span>
          <span className="text-base font-black text-slate-900 font-mono mt-0.5">{avgAlpha}</span>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-[#eee7dc] flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">High Retention (α ≥ 0.7)</span>
          <span className="text-base font-black text-emerald-800 font-mono mt-0.5">{highAlphaCount} SKUs</span>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-[#eee7dc] flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Pure DC Push (α = 0.0)</span>
          <span className="text-base font-black text-slate-700 font-mono mt-0.5">{zeroAlphaCount} SKUs</span>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-[#eee7dc] flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Convergence Engine</span>
          <span className="text-xs font-bold text-[#78350f] mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#b45309]" />
            BCA Ascent Search
          </span>
        </div>
      </div>

      {/* Alpha Grid List */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto">
        {filteredAlphas.slice(0, 48).map(policy => {
          const alphaPct = Math.round(policy.alpha * 100);
          const isHigh = policy.alpha >= 0.6;
          const isZero = policy.alpha === 0;

          return (
            <div
              key={`${policy.factoryId}-${policy.skuId}`}
              className="bg-white border border-[#e8e2d8] hover:border-[#b45309] p-3 rounded-xl transition flex flex-col justify-between gap-2 shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">{policy.skuName || policy.skuId}</div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3 text-[#b45309]" />
                    <span>{policy.factoryId} • {policy.skuId}</span>
                  </div>
                </div>
                <div
                  className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${
                    isHigh
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : isZero
                      ? 'bg-slate-100 text-slate-600 border border-slate-200'
                      : 'bg-[#f5f0e6] text-[#78350f] border border-[#e2d8ca]'
                  }`}
                >
                  α = {policy.alpha.toFixed(2)}
                </div>
              </div>

              {/* Progress Slider Display */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-600 mb-1 font-medium">
                  <span>Factory BoF: <strong className="text-slate-900">{alphaPct}%</strong></span>
                  <span>DC Push: <strong className="text-slate-600">{100 - alphaPct}%</strong></span>
                </div>
                <div className="w-full h-2 bg-[#ece5da] rounded-full overflow-hidden flex border border-[#ded5c7]">
                  <div
                    className="bg-[#b45309] h-full transition-all duration-300"
                    style={{ width: `${alphaPct}%` }}
                  />
                  <div
                    className="bg-[#dfd7cc] h-full transition-all duration-300"
                    style={{ width: `${100 - alphaPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-[#f0ebe2]">
                <span>Annual STO: {policy.totalStoPallets?.toLocaleString() || '3,200'} p</span>
                <span className="text-[#78350f] font-bold">
                  Retained: {Math.round((policy.totalStoPallets || 3200) * policy.alpha).toLocaleString()} p
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAlphas.length > 48 && (
        <div className="p-2.5 bg-[#faf8f4] border-t border-[#eee7dc] text-center text-xs text-slate-500">
          Showing 48 of {filteredAlphas.length} optimized policies. Refine search or filter by factory to narrow results.
        </div>
      )}
    </div>
  );
};
