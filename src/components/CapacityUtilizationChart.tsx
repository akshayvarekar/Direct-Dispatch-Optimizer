import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { DailyLedgerPoint, FactorySiteResult } from '../types';
import { Warehouse } from 'lucide-react';

interface CapacityUtilizationChartProps {
  ledgerData: DailyLedgerPoint[];
  siteResults: FactorySiteResult[];
  useWHCapacityCons: boolean;
  selectedFactoryId?: string;
}

export const CapacityUtilizationChart: React.FC<CapacityUtilizationChartProps> = ({
  ledgerData,
  siteResults,
  useWHCapacityCons,
  selectedFactoryId = 'ALL',
}) => {
  const factoryIds = siteResults.map(r => r.factoryId);
  const initialFacId = selectedFactoryId !== 'ALL' && factoryIds.includes(selectedFactoryId)
    ? selectedFactoryId
    : factoryIds[0] || 'FAC-01';

  const [selectedFacId, setSelectedFacId] = useState<string>(initialFacId);

  useEffect(() => {
    if (selectedFactoryId !== 'ALL' && factoryIds.includes(selectedFactoryId)) {
      setSelectedFacId(selectedFactoryId);
    }
  }, [selectedFactoryId, factoryIds]);

  const selectedFactory = siteResults.find(r => r.factoryId === selectedFacId) || siteResults[0];

  const filteredData = ledgerData
    .filter(d => d.factoryId === selectedFacId)
    .map(d => ({
      ...d,
      dateFormatted: d.date.slice(5), // 'MM-DD'
    }));

  const capacity = selectedFactory?.capacityPallets || 8000;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-[#fcd7c3] p-3.5 rounded-xl shadow-lg text-xs space-y-1 z-50 text-slate-800">
          <div className="font-bold text-slate-900 border-b border-orange-100 pb-1">
            Date: {data.date}
          </div>
          <div className="text-orange-950 font-bold">
            BoF Stock Held: <span className="text-orange-700 font-black">{data.bofStock.toLocaleString()} pallets</span>
          </div>
          <div className="text-slate-600">
            Godown Capacity: <span className="font-semibold">{capacity.toLocaleString()} pallets</span>
          </div>
          <div className="text-amber-900 font-bold">
            Utilization: {data.utilizationPct}%
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-orange-100">
            <span>Inflow (Retained STO): +{data.inflow}p</span>
            <span>DD Dispatch: -{data.dispatch}p</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-[#fcd7c3] rounded-xl p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100/80 flex items-center justify-center text-orange-700 border border-orange-200">
            <Warehouse className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Factory BoF Stock Ledger & Capacity Timeline</h2>
            <p className="text-xs text-slate-500">
              Daily BoF inventory accumulation and drawdowns against factory storage ceiling
            </p>
          </div>
        </div>

        {/* Factory selector pill buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#fff4ec] p-1 rounded-lg border border-orange-200">
          {siteResults.map(f => (
            <button
              key={f.factoryId}
              onClick={() => setSelectedFacId(f.factoryId)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                selectedFacId === f.factoryId
                  ? 'bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white shadow-2xs font-bold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-orange-100/80'
              }`}
            >
              {f.factoryId}
            </button>
          ))}
        </div>
      </div>

      <div className="h-60 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <defs>
              <linearGradient id="bofStockGradPeach" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffedd5" vertical={false} />
            <XAxis
              dataKey="dateFormatted"
              stroke="#9a3412"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              stroke="#9a3412"
              fontSize={11}
              domain={[0, Math.ceil(capacity * 1.1)]}
              tickFormatter={(val: number) => `${(val / 1000).toFixed(1)}k`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={capacity}
              stroke="#d97706"
              strokeDasharray="4 4"
              label={{
                value: `Godown Cap (${capacity.toLocaleString()}p)`,
                fill: '#b45309',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
            <Area
              type="monotone"
              dataKey="bofStock"
              name="BoF Stock"
              stroke="#ea580c"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#bofStockGradPeach)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-orange-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div>
            Plant: <span className="text-slate-900 font-bold">{selectedFactory?.factoryName}</span>
          </div>
          <div>
            Avg Daily Stock: <span className="text-orange-950 font-bold">{selectedFactory?.avgDailyBofStock.toLocaleString()} p</span>
          </div>
          <div>
            Peak Util: <span className="text-amber-900 font-bold">{selectedFactory?.maxCapacityUtilPct}%</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          {useWHCapacityCons ? '✓ Hard Capacity Constraint Enforced' : 'ℹ Unconstrained Inflow Simulation'}
        </div>
      </div>
    </div>
  );
};
