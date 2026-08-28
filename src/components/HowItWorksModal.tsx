import React from 'react';
import { X, Cpu, Layers, Sliders } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#e8e2d8] rounded-2xl max-w-3xl w-full p-6 text-slate-900 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-[#faf8f4] hover:bg-[#f0ebe1] p-2 rounded-lg transition cursor-pointer border border-[#e0d8cc]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#fbf7f0] flex items-center justify-center text-[#b45309] border border-[#eee4d6]">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Direct Dispatch Optimization Engine</h2>
            <p className="text-xs text-slate-500">Simulation-Based Policy Search & 5-Stage Constraint Architecture</p>
          </div>
        </div>

        <div className="space-y-5 text-xs text-slate-700">
          {/* Section 1: Decision Variable */}
          <div className="bg-[#faf8f4] border border-[#eee7dc] rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#b45309]" />
              1. Decision Variable: Allocation Factor (α)
            </h3>
            <p className="leading-relaxed text-slate-600">
              For every <code className="text-[#78350f] font-mono bg-white px-1 py-0.5 rounded border border-[#e2d8ca] font-bold">(Factory, SKU)</code> pair in the network, the optimizer selects an Allocation Factor <code className="text-[#78350f] font-mono bg-white px-1 py-0.5 rounded border border-[#e2d8ca] font-bold">α ∈ [0, 1]</code>.
              This represents the fraction of outbound stock retained at the plant as <strong>BoF (Buffer on Floor) stock</strong> for direct dispatch. The remainder <code className="text-slate-600 font-mono bg-white px-1 py-0.5 rounded border border-[#e2d8ca] font-bold">(1 - α)</code> flows to regional DCs via standard STOs.
            </p>
          </div>

          {/* Section 2: 5 Constraints Sequence */}
          <div className="bg-[#faf8f4] border border-[#eee7dc] rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#b45309]" />
              2. Inner Simulation: 5 Sequential Constraints
            </h3>

            <div className="space-y-2.5">
              <div className="bg-white p-3 rounded-lg border border-[#eee7dc] shadow-2xs">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#f5f0e6] text-[#78350f] flex items-center justify-center text-[10px] font-bold">1</span>
                  Grouping & DD-Eligibility (Min Truckload Floor)
                </div>
                <p className="text-slate-600">
                  Sales orders for the same customer (or within 25km clusters when <code className="text-[#78350f] font-mono font-bold">MilkRuns=YES</code>) within the delivery horizon (0/3/7 days) are aggregated. Groups with combined quantity ≥ <code className="text-[#78350f] font-mono font-bold">MinTruckload</code> (26 pallets) qualify for DD.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#eee7dc] shadow-2xs">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#f5f0e6] text-[#78350f] flex items-center justify-center text-[10px] font-bold">2</span>
                  BoF Stock Inflow & WH Godown Capacity Cap
                </div>
                <p className="text-slate-600">
                  On each STO date, candidate inflow = <code className="text-[#78350f] font-mono font-bold">α × STO_Qty</code>. When <code className="text-[#78350f] font-mono font-bold">UseWHCapacityCons=YES</code>, total BoF stock across all SKUs held at the factory is capped at that factory's physical <code className="text-slate-800 font-mono">Godown_Capacity_Pallets</code>.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#eee7dc] shadow-2xs">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#f5f0e6] text-[#78350f] flex items-center justify-center text-[10px] font-bold">3</span>
                  Shipment Eligibility & Partial Dispatch
                </div>
                <p className="text-slate-600">
                  <code className="text-slate-800 font-mono font-bold">DispatchQty = min(Group_Qty, AvailableStock)</code>. If <code className="text-slate-800 font-mono font-bold">DispatchQty ≥ MinTruckload</code>, the group dispatches DD for DispatchQty pallets and draws down the ledger. Any shortfall ships via traditional DC route as Losses.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#eee7dc] shadow-2xs">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#f5f0e6] text-[#78350f] flex items-center justify-center text-[10px] font-bold">4</span>
                  Daily Capacity Utilization Tracking
                </div>
                <p className="text-slate-600">
                  Maintains a day-by-day BoF inventory ledger across 365 days, tracking average and peak capacity utilization percentages per production plant.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#eee7dc] shadow-2xs">
                <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#f5f0e6] text-[#78350f] flex items-center justify-center text-[10px] font-bold">5</span>
                  Objective Score Formulation (Search-Tuning Signal)
                </div>
                <div className="bg-white p-2.5 rounded font-mono text-[11px] text-[#78350f] border border-[#eee7dc] mt-1 font-semibold">
                  Score = BOFWeight × UnitSavings × BOFOrders + LossWeight × UnitSavings × Losses + BOFStockWeight × UnitSavings × AvgBOFStock
                </div>
                <p className="text-slate-600 mt-2">
                  <strong>Score</strong> is an internal tuning function (incorporating Loss penalty multipliers like LossWeight = -20) used exclusively to guide the Coordinate Ascent search. 
                  In contrast, <strong>Total Net Savings ($)</strong> represents pure actual dollar savings: <code className="text-[#78350f] font-mono font-bold">Total Transport Savings + Total WH Savings</code> from actually dispatched DD pallets (no search weights applied).
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Outer Optimization Layer */}
          <div className="bg-[#faf8f4] border border-[#eee7dc] rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#b45309]" />
              3. Outer Optimization: Block Coordinate Ascent
            </h3>
            <p className="leading-relaxed text-slate-600 mb-2">
              • <strong>Unconstrained Scenarios:</strong> 1-D grid search + fine refinement independently per Factory-SKU.
            </p>
            <p className="leading-relaxed text-slate-600">
              • <strong>Capacity-Constrained Scenarios:</strong> Joint Block Coordinate Ascent (BCA) cycling through each Factory-SKU over multiple passes, holding other alphas fixed and enforcing physical godown ceilings.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#eee7dc] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#b45309] hover:bg-[#92400e] text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer shadow-2xs"
          >
            Got it, return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
