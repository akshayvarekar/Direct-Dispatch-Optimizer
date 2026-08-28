import React from 'react';
import { Truck, RotateCcw, Play, Building2, SlidersHorizontal } from 'lucide-react';
import { DatasetStatus, ScenarioParameters } from '../types';

interface HeaderProps {
  status?: DatasetStatus | null;
  isRunning: boolean;
  isRunningAll: boolean;
  onResetSample: () => void;
  onRunAll: () => void;
  onOpenHowItWorks?: () => void;
  scenarios: ScenarioParameters[];
  selectedScenario: string;
  onSelectScenario: (name: string) => void;
  availableFactories: { id: string; name: string }[];
  selectedFactory: string;
  onSelectFactory: (factoryId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isRunning,
  isRunningAll,
  onResetSample,
  onRunAll,
  scenarios,
  selectedScenario,
  onSelectScenario,
  availableFactories,
  selectedFactory,
  onSelectFactory,
}) => {
  return (
    <header className="bg-[#faf8f4] border-b border-[#e8e2d8] text-slate-900 sticky top-0 z-30 min-h-[4rem] shrink-0 shadow-2xs">
      <div className="h-full px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & App Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[#b45309] flex items-center justify-center text-white shadow-2xs">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                Direct Dispatch Optimizer
              </span>
              <span className="text-[10px] font-semibold bg-[#ede7dc] text-[#5e4f41] border border-[#ded5c7] px-2 py-0.5 rounded">
                Enterprise Supply Chain
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-normal hidden sm:block">
              Factory to Customer Direct Routing & Policy Engine
            </p>
          </div>
        </div>

        {/* Top Filters: Scenario Selection & Factory Selection */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter 1: Scenario Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-[#e0d8cc] rounded-lg px-2.5 py-1.5 shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#b45309] shrink-0" />
            <label className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
              Scenario:
            </label>
            <select
              value={selectedScenario}
              onChange={e => onSelectScenario(e.target.value)}
              disabled={isRunning || isRunningAll}
              className="bg-transparent text-xs font-semibold text-slate-900 outline-none cursor-pointer pr-1 disabled:opacity-50"
            >
              {scenarios.map(scn => (
                <option key={scn.ScnName} value={scn.ScnName}>
                  {scn.ScnName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Factory Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-[#e0d8cc] rounded-lg px-2.5 py-1.5 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-[#b45309] shrink-0" />
            <label className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
              Factory:
            </label>
            <select
              value={selectedFactory}
              onChange={e => onSelectFactory(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-900 outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Factories ({availableFactories.length})</option>
              {availableFactories.map(f => (
                <option key={f.id} value={f.id}>
                  {f.id} - {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          <button
            onClick={onResetSample}
            disabled={isRunning || isRunningAll}
            className="flex items-center gap-1.5 bg-white hover:bg-[#fbf9f6] text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#e0d8cc] transition cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Reset to default synthetic dataset"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Run All Scenarios button */}
          <button
            onClick={onRunAll}
            disabled={isRunning || isRunningAll}
            className="flex items-center gap-1.5 bg-[#b45309] hover:bg-[#92400e] text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunningAll ? 'animate-spin' : ''}`} />
            <span>{isRunningAll ? 'Optimizing All...' : 'Run All Scenarios'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
