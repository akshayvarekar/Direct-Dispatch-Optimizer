import React from 'react';
import {
  DollarSign,
  TrendingUp,
  Truck,
  Leaf,
  CheckCircle,
  Package,
  Layers,
  Warehouse,
  Building2,
} from 'lucide-react';
import { ScenarioRunResult } from '../types';

interface SummaryCardsProps {
  result: ScenarioRunResult;
  selectedFactoryId?: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ result, selectedFactoryId = 'ALL' }) => {
  const isFactoryFiltered = selectedFactoryId !== 'ALL';
  const siteMatch = isFactoryFiltered
    ? result.siteResults.find(s => s.factoryId === selectedFactoryId)
    : null;

  const totalCostSavings = siteMatch ? siteMatch.totalSavings : result.totalCostSavings;
  const totalTransportSavings = siteMatch ? siteMatch.transportSavings : result.totalTransportSavings;
  const totalWHSavings = siteMatch ? siteMatch.whSavings : result.totalWHSavings;
  const totalCO2SavedKg = siteMatch ? siteMatch.co2SavedKg : result.totalCO2SavedKg;
  const totalDDPallets = siteMatch ? siteMatch.ddPallets : result.totalDDPallets;
  const totalLossPallets = siteMatch ? siteMatch.lossesPallets : result.totalLossPallets;
  const totalOrders = siteMatch ? siteMatch.totalOrdersEvaluated : result.totalOrdersEvaluated;
  const fillRateLossPct = siteMatch ? siteMatch.fillRateLossPct : result.fillRateLossPct;
  const eligiblePallets = totalDDPallets + totalLossPallets;

  const formatCurrency = (val: number) => {
    return '$' + Math.round(val).toLocaleString();
  };

  const formatNumber = (val: number) => {
    return Math.round(val).toLocaleString();
  };

  return (
    <div className="space-y-3">
      {isFactoryFiltered && siteMatch && (
        <div className="bg-[#f7f3ec] border border-[#e2dacd] text-slate-900 px-3.5 py-1.5 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Building2 className="w-4 h-4 text-[#b45309]" />
            <span>Filtered by Factory: {siteMatch.factoryId} — {siteMatch.factoryName}</span>
          </div>
          <span className="text-[11px] text-[#78350f] font-medium">
            Capacity: {siteMatch.capacityPallets.toLocaleString()} pallets
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Net Cost Savings */}
        <div className="bg-white border border-[#e8e2d8] rounded-xl p-5 flex flex-col justify-between shadow-2xs hover:border-[#b45309] transition duration-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78350f]">
                Total Net Savings
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#fcf8f2] flex items-center justify-center text-[#b45309] border border-[#eee4d6]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(totalCostSavings)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f0ebe2] flex items-center justify-between text-xs text-slate-600">
            <span>Transport + WH Net</span>
            <span className="font-semibold flex items-center gap-1 text-[#78350f] bg-[#fdfaf5] px-2 py-0.5 rounded border border-[#ede3d5]">
              <TrendingUp className="w-3.5 h-3.5 text-[#b45309]" />
              Score: {Math.round(result.score).toLocaleString()}
            </span>
          </div>
        </div>

        {/* 2. Transport Cost Savings */}
        <div className="bg-white border border-[#e8e2d8] rounded-xl p-5 flex flex-col justify-between shadow-2xs hover:border-[#b45309] transition duration-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78350f]">
                Transport Savings
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#fcf8f2] flex items-center justify-center text-[#b45309] border border-[#eee4d6]">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(totalTransportSavings)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f0ebe2] flex items-center justify-between text-xs text-slate-600">
            <span>(SCPP + PCPP - DDCPP)</span>
            <span className="text-[#78350f] font-semibold bg-[#fdfaf5] px-2 py-0.5 rounded border border-[#ede3d5]">
              {totalDDPallets > 0
                ? `$${(totalTransportSavings / totalDDPallets).toFixed(2)}/p`
                : '$0/p'}
            </span>
          </div>
        </div>

        {/* 3. WH Cost Savings */}
        <div className="bg-white border border-[#e8e2d8] rounded-xl p-5 flex flex-col justify-between shadow-2xs hover:border-[#b45309] transition duration-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78350f]">
                Warehousing Savings
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#fcf8f2] flex items-center justify-center text-[#b45309] border border-[#eee4d6]">
                <Warehouse className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(totalWHSavings)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f0ebe2] flex items-center justify-between text-xs text-slate-600">
            <span>DC Handling & Storage</span>
            <span className="text-[#78350f] font-semibold bg-[#fdfaf5] px-2 py-0.5 rounded border border-[#ede3d5]">
              {totalDDPallets > 0
                ? `$${(totalWHSavings / totalDDPallets).toFixed(2)}/p`
                : '$0/p'}
            </span>
          </div>
        </div>

        {/* 4. Estimated CO2 Reduction */}
        <div className="bg-white border border-[#e8e2d8] rounded-xl p-5 flex flex-col justify-between shadow-2xs hover:border-emerald-400 transition duration-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                CO₂ Reduction
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50/70 flex items-center justify-center text-emerald-700 border border-emerald-200">
                <Leaf className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-800 tracking-tight">
              {totalCO2SavedKg >= 1000
                ? `${(totalCO2SavedKg / 1000).toFixed(2)} Metric Tons`
                : `${formatNumber(totalCO2SavedKg)} kg`}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f0ebe2] flex items-center justify-between text-xs text-slate-600">
            <span>0.15 kg/pallet-km</span>
            <span className="text-emerald-900 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Emission Avoidance
            </span>
          </div>
        </div>

        {/* 5. Total Orders Evaluated */}
        <div className="bg-white border border-[#e8e2d8] rounded-xl p-5 flex flex-col justify-between shadow-2xs hover:border-[#b45309] transition duration-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Orders Evaluated
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#faf8f4] flex items-center justify-center text-slate-700 border border-[#eee4d6]">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatNumber(totalOrders)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f0ebe2] flex items-center justify-between text-xs text-slate-600">
            <span>Annual Demand</span>
            <span className="text-slate-800 font-medium">Sales Order Lines</span>
          </div>
        </div>

        {/* 6. % DD-Eligible Orders */}
        <div className="bg-white border border-[#e8e2d8] rounded-xl p-5 flex flex-col justify-between shadow-2xs hover:border-[#b45309] transition duration-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78350f]">
                DD-Eligible Orders
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#fcf8f2] flex items-center justify-center text-[#b45309] border border-[#eee4d6]">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight flex items-baseline gap-2">
              <span>{result.eligibleOrdersPct}%</span>
              <span className="text-xs font-normal text-slate-500">
                ({formatNumber(result.eligibleOrdersCount)} orders)
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#f0ebe2] flex items-center justify-between text-xs text-slate-600">
            <span>Min Truckload ≥ {result.params.MinTruckload}p</span>
            <span className="text-[#78350f] font-bold">{formatNumber(eligiblePallets)} pallets</span>
          </div>
        </div>

        {/* 7. Total DD Pallets Dispatched vs Losses */}
        <div className="sm:col-span-2 lg:col-span-2 bg-white border border-[#e8e2d8] rounded-xl p-5 flex flex-col justify-between shadow-2xs hover:border-[#b45309] transition duration-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#78350f]">
                DD Volume vs Traditional Route
              </span>
              <div className="w-8 h-8 rounded-lg bg-[#fcf8f2] flex items-center justify-center text-[#b45309] border border-[#eee4d6]">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {formatNumber(totalDDPallets)}{' '}
                  <span className="text-xs font-normal text-slate-500">Pallets Shipped DD</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Fill-rate Loss: </span>
                <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {fillRateLossPct}% ({formatNumber(totalLossPallets)} p)
                </span>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="mt-4">
            <div className="w-full h-2.5 bg-[#f0ebe2] rounded-full overflow-hidden flex border border-[#e2dacd]">
              <div
                className="bg-[#b45309] h-full transition-all duration-500"
                style={{
                  width: `${
                    eligiblePallets > 0
                      ? Math.min(100, (totalDDPallets / eligiblePallets) * 100)
                      : 0
                  }%`,
                }}
                title={`Dispatched DD: ${totalDDPallets} pallets`}
              />
              <div
                className="bg-amber-300 h-full transition-all duration-500"
                style={{
                  width: `${
                    eligiblePallets > 0
                      ? Math.min(100, (totalLossPallets / eligiblePallets) * 100)
                      : 0
                  }%`,
                }}
                title={`Losses / Traditional Route: ${totalLossPallets} pallets`}
              />
            </div>
            <div className="flex justify-between text-[11px] font-medium text-slate-600 mt-1.5">
              <span className="text-slate-900 font-semibold">● DD Dispatched ({formatNumber(totalDDPallets)} p)</span>
              <span className="text-amber-900 font-semibold">● Traditional Route ({formatNumber(totalLossPallets)} p)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
