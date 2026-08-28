import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { ScenarioParameters, ScenarioRunResult } from '../types';
import { BarChart3 } from 'lucide-react';

interface ScenarioComparisonChartProps {
  scenarios: ScenarioParameters[];
  allResults: ScenarioRunResult[];
  activeScenarioName: string;
  onSelectScenario: (name: string) => void;
}

export const ScenarioComparisonChart: React.FC<ScenarioComparisonChartProps> = ({
  scenarios,
  allResults,
  activeScenarioName,
  onSelectScenario,
}) => {
  // Combine scenario parameters with results
  const resultMap = new Map<string, ScenarioRunResult>();
  allResults.forEach(r => resultMap.set(r.scenarioName, r));

  const chartData = scenarios.map(scn => {
    const res = resultMap.get(scn.ScnName);
    const savings = res?.totalCostSavings ?? (scn.totalCostSavings ?? 0);
    const transportSavings = res?.totalTransportSavings ?? Math.round(savings * 0.65);
    const whSavings = res?.totalWHSavings ?? Math.round(savings * 0.35);
    const ddPallets = res?.totalDDPallets ?? 0;

    return {
      name: scn.ScnName.replace('Scenario_', 'S').replace('Scn_', 'S'),
      fullName: scn.ScnName,
      totalSavings: Math.round(savings),
      transportSavings: Math.round(transportSavings),
      whSavings: Math.round(whSavings),
      ddPallets: Math.round(ddPallets),
      horizon: scn.OrderCombHorizon,
      milkRuns: scn.MilkRuns,
      capCons: scn.UseWHCapacityCons,
      hasResult: !!res || scn.hasResult,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-[#e8e2d8] p-3.5 rounded-xl shadow-lg text-xs space-y-1.5 z-50 text-slate-800">
          <div className="font-bold text-slate-900 border-b border-[#eee7dc] pb-1.5 flex items-center justify-between gap-2">
            <span>{data.fullName}</span>
            {data.fullName === activeScenarioName && (
              <span className="bg-[#f5f0e6] text-[#78350f] border border-[#e2d8ca] px-1.5 py-0.2 rounded text-[10px] font-semibold">
                Active
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
            <div>Order Horizon: <span className="font-semibold text-slate-900">{data.horizon} Days</span></div>
            <div>Milk Runs (25km): <span className="font-semibold text-emerald-700">{data.milkRuns}</span></div>
            <div>WH Cap Enforced: <span className="font-semibold text-slate-800">{data.capCons}</span></div>
            <div>DD Pallets: <span className="font-semibold text-[#78350f]">{data.ddPallets.toLocaleString()} p</span></div>
          </div>
          <div className="pt-2 border-t border-[#eee7dc] space-y-0.5">
            <div className="flex justify-between text-slate-600">
              <span>Transport Savings:</span>
              <span className="font-semibold text-slate-900">${data.transportSavings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>WH Savings:</span>
              <span className="font-semibold text-slate-900">${data.whSavings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-[#eee7dc]">
              <span>Total Net Savings:</span>
              <span>${data.totalSavings.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-[10px] text-[#b45309] italic pt-1">
            Click bar to activate this scenario
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
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Scenario Policy Cost Savings Comparison</h2>
            <p className="text-xs text-slate-500">
              Total annual savings across all 12 supply chain policy configurations ($ USD)
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-600 flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b45309] inline-block"></span> Active
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dfd4c5] inline-block"></span> Other Scenarios
          </span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload[0]) {
                onSelectScenario(state.activePayload[0].payload.fullName);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe1" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#8c7b6b"
              fontSize={11}
              interval={0}
              angle={-25}
              textAnchor="end"
              tickLine={false}
            />
            <YAxis
              stroke="#8c7b6b"
              fontSize={11}
              tickFormatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="totalSavings"
              radius={[6, 6, 0, 0]}
              cursor="pointer"
              animationDuration={800}
            >
              {chartData.map(entry => (
                <Cell
                  key={entry.fullName}
                  fill={
                    entry.fullName === activeScenarioName
                      ? '#b45309' // warm amber
                      : entry.hasResult
                      ? '#d97706' // lighter amber
                      : '#e8dfd1' // light cream/wheat
                  }
                  stroke={entry.fullName === activeScenarioName ? '#92400e' : undefined}
                  strokeWidth={entry.fullName === activeScenarioName ? 1.5 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-[#eee7dc] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div>
          💡 <span className="text-slate-800 font-bold">Tip:</span> Scenarios with <span className="text-[#78350f] font-bold">MilkRuns=YES</span> and <span className="text-[#78350f] font-bold">7-day horizon</span> maximize full truckloads and Direct Dispatch volume.
        </div>
        <div className="text-[11px] text-[#b45309] font-medium">
          Click any bar to switch active scenario
        </div>
      </div>
    </div>
  );
};
