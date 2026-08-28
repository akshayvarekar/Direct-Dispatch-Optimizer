import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { FactorySiteResult } from '../types';
import { Truck } from 'lucide-react';

interface VolumeComparisonChartProps {
  siteResults: FactorySiteResult[];
  selectedFactoryId?: string;
}

export const VolumeComparisonChart: React.FC<VolumeComparisonChartProps> = ({
  siteResults,
  selectedFactoryId = 'ALL',
}) => {
  const filteredResults = selectedFactoryId === 'ALL'
    ? siteResults
    : siteResults.filter(r => r.factoryId === selectedFactoryId);

  const chartData = filteredResults.map(r => ({
    name: r.factoryName.split('(')[0].trim(),
    fullName: r.factoryName,
    ddPallets: r.ddPallets,
    traditionalPallets: r.lossesPallets,
    totalPallets: r.ddPallets + r.lossesPallets,
    sharePct: r.ddPallets + r.lossesPallets > 0
      ? Math.round((r.ddPallets / (r.ddPallets + r.lossesPallets)) * 100)
      : 0,
  }));

  const totalDD = filteredResults.reduce((s, r) => s + r.ddPallets, 0);
  const totalTrad = filteredResults.reduce((s, r) => s + r.lossesPallets, 0);
  const totalOverall = totalDD + totalTrad;
  const overallDDPct = totalOverall > 0 ? ((totalDD / totalOverall) * 100).toFixed(1) : '0';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-[#e8e2d8] p-3.5 rounded-xl shadow-lg text-xs space-y-1.5 z-50 text-slate-800">
          <div className="font-bold text-slate-900 border-b border-[#eee7dc] pb-1.5">
            {data.fullName}
          </div>
          <div className="space-y-1 text-slate-600">
            <div className="flex justify-between gap-4 text-[#78350f] font-bold">
              <span>Direct Dispatch Volume:</span>
              <span className="text-[#b45309] font-bold">{data.ddPallets.toLocaleString()} pallets</span>
            </div>
            <div className="flex justify-between gap-4 text-slate-500">
              <span>Traditional DC Route:</span>
              <span className="font-semibold">{data.traditionalPallets.toLocaleString()} pallets</span>
            </div>
            <div className="flex justify-between gap-4 text-slate-900 font-bold pt-1.5 border-t border-[#eee7dc]">
              <span>Total Evaluated:</span>
              <span>{data.totalPallets.toLocaleString()} pallets</span>
            </div>
            <div className="text-[11px] text-[#78350f] font-bold pt-0.5">
              DD Share: {data.sharePct}%
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-[#e8e2d8] rounded-xl p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#fbf7f0] flex items-center justify-center text-[#b45309] border border-[#eee4d6]">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Direct Dispatch vs Traditional Volume</h2>
            <p className="text-xs text-slate-500">
              Pallets dispatched directly from plant vs routed through Distribution Centers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#f6f1e8] px-3 py-1 rounded-lg border border-[#e2d8cb] text-xs">
          <span className="text-slate-600 font-medium">DD Penetration:</span>
          <span className="text-[#78350f] font-extrabold">{overallDDPct}%</span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe1" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#8c7b6b"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#8c7b6b"
              fontSize={11}
              tickFormatter={(val: number) => `${(val / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
            />
            <Bar
              name="Direct Dispatch (DD)"
              dataKey="ddPallets"
              stackId="a"
              fill="#b45309" // warm amber
              radius={[0, 0, 0, 0]}
            />
            <Bar
              name="Traditional DC Route"
              dataKey="traditionalPallets"
              stackId="a"
              fill="#dfd4c5" // light warm cream/tan
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-[#eee7dc] flex justify-between items-center text-xs text-slate-600">
        <div>
          Total Volume: <span className="font-bold text-slate-900">{totalOverall.toLocaleString()} Pallets</span>
        </div>
        <div className="text-[#78350f] font-bold">
          {totalDD.toLocaleString()} Pallets DD Dispatched
        </div>
      </div>
    </div>
  );
};
