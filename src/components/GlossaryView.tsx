import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Truck,
  Warehouse,
  Sliders,
  DollarSign,
  ArrowRight,
  HelpCircle,
  Sparkles,
  FileCheck,
} from 'lucide-react';

interface GlossaryItem {
  id: string;
  term: string;
  category: 'logistics' | 'costs' | 'optimization' | 'capacity';
  shortDef: string;
  detailedExplanation: string;
  formulaOrExample?: string;
  plannerImpact: string;
  badge: string;
}

const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    id: 'direct-dispatch',
    term: 'Direct Dispatch (DD)',
    category: 'logistics',
    badge: 'Core Concept',
    shortDef: 'Shipping customer orders directly from the manufacturing factory floor rather than sending them through intermediate regional distribution centers (DCs).',
    detailedExplanation:
      'In traditional supply chain fulfillment, manufactured pallets travel via primary freight to a regional Distribution Center (DC), where they are stored, picked, and later re-shipped via secondary freight to the end customer. Direct Dispatch bypasses the regional DC entirely, transporting full or combined truckloads straight from the production plant to the customer destination.',
    formulaOrExample: 'Traditional Route: Factory ➔ DC ➔ Customer\nDirect Dispatch: Factory ➔ Customer (Bypasses DC Handling & Storage)',
    plannerImpact: 'Saves 100% of double-handling and intermediate DC warehousing costs, reduces transit time, and lowers freight carbon emissions.',
  },
  {
    id: 'pcpp',
    term: 'PCPP (Primary Cost Per Pallet)',
    category: 'costs',
    badge: 'Freight Rate',
    shortDef: 'The unit freight cost incurred to move one standard pallet from a manufacturing factory to a regional distribution center (DC).',
    detailedExplanation:
      'PCPP represents trunk-haul or inter-facility transfer freight charges. Because factory-to-DC lanes typically move in high-volume full truckloads (FTL), PCPP is optimized for bulk linehaul transport.',
    formulaOrExample: 'PCPP ($/pallet) = Total Inter-facility Freight Invoice ÷ Total Pallets Moved',
    plannerImpact: 'Direct dispatch completely avoids PCPP by eliminating the leg between the manufacturing plant and the regional warehouse.',
  },
  {
    id: 'scpp',
    term: 'SCPP (Secondary Cost Per Pallet)',
    category: 'costs',
    badge: 'Freight Rate',
    shortDef: 'The last-mile / delivery freight cost to transport one pallet from the regional DC to the end customer site.',
    detailedExplanation:
      'Secondary transport covers regional distribution from regional hubs to retail stores or customer distribution nodes. It often incurs higher per-km rates due to shorter distances and regional distribution logistics.',
    formulaOrExample: 'SCPP ($/pallet) = Secondary Delivery Freight Fee ÷ Order Pallet Quantity',
    plannerImpact: 'Bypassed under Direct Dispatch in exchange for single-leg Direct Dispatch freight (DDCPP).',
  },
  {
    id: 'ddcpp',
    term: 'DDCPP (Direct Dispatch Cost Per Pallet)',
    category: 'costs',
    badge: 'Freight Rate',
    shortDef: 'The direct point-to-point freight cost to move one pallet straight from the factory to the customer.',
    detailedExplanation:
      'Instead of paying PCPP + SCPP across two separate truck journeys, DDCPP is the single dedicated shipment cost between the production plant and customer receiving dock.',
    formulaOrExample: 'Net Transport Savings = (PCPP + SCPP) - DDCPP',
    plannerImpact: 'Whenever DDCPP < (PCPP + SCPP), direct shipping unlocks positive transportation savings.',
  },
  {
    id: 'alpha-factor',
    term: 'Alpha Policy Factor (α)',
    category: 'optimization',
    badge: 'Optimization Variable',
    shortDef: 'The mathematically optimal proportion (between 0.00 and 1.00) of factory production capacity for SKU (s) at Factory (f) reserved for Direct Dispatch.',
    detailedExplanation:
      'The linear solver determines an α (alpha) coefficient for every Factory-SKU combination. An α of 0.80 means 80% of SKU inventory at that plant is tagged for Direct Dispatch customer orders, while 20% is routed traditionally to replenish regional DCs to protect regional fill-rates.',
    formulaOrExample: 'α_{f,s} ∈ [0, 1] — Solved by Mixed-Integer Linear Programming (MILP)',
    plannerImpact: 'Guides daily staging allocation so plant schedulers know how much volume to hold for direct customer shipping without starving regional hubs.',
  },
  {
    id: 'bof',
    term: 'Bill of Factors / BoF Staging Buffer',
    category: 'capacity',
    badge: 'Plant Inventory',
    shortDef: 'The dedicated plant-level staging buffer and stock allocation created at the factory to aggregate orders for direct dispatch.',
    detailedExplanation:
      'Because direct dispatch orders must be grouped into full truckloads, finished goods are temporarily buffered in the factory staging area (BoF Stock) according to target Days of Inventory on Hand (DOH).',
    formulaOrExample: 'BoF Target Stock (Pallets) = Average Daily DD Demand × DOH_BoF_weeks × 7',
    plannerImpact: 'Helps plant warehouse supervisors manage factory dock floor capacity and avoid dock congestion.',
  },
  {
    id: 'min-truckload',
    term: 'Min Truckload Threshold (TL_min)',
    category: 'optimization',
    badge: 'Rule Constraint',
    shortDef: 'The minimum pallet quantity required in an order (or aggregated order cluster) before direct factory shipment is permitted.',
    detailedExplanation:
      'Direct dispatch is cost-effective when trailers are fully or substantially loaded (e.g., 20 or 26 pallets). Orders below this threshold are routed through the regional DC network unless combined within the delivery horizon.',
    formulaOrExample: 'Order Eligible if: Order Pallets (or Group Combined Pallets) ≥ Min Truckload',
    plannerImpact: 'Higher thresholds prevent shipping partially loaded trailers at high cost, ensuring high vehicle fill-rates.',
  },
  {
    id: 'milk-runs',
    term: 'Milk Runs (25 km Proximity Clustering)',
    category: 'logistics',
    badge: 'Route Feature',
    shortDef: 'Multi-stop truck routes consolidating small customer orders located within a 25 km geographic radius into a single shared Direct Dispatch truck.',
    detailedExplanation:
      'When an individual customer order is smaller than the full truckload threshold, enabling Milk Runs allows the optimizer to combine nearby customer drops located within 25 km, enabling direct dispatch savings for smaller order sizes.',
    formulaOrExample: 'Cluster = Customer Orders within ≤ 25 km distance on the same delivery date',
    plannerImpact: 'Drastically expands the percentage of Direct Dispatch eligible orders without losing vehicle utilization.',
  },
  {
    id: 'order-comb-horizon',
    term: 'Order Combination Horizon',
    category: 'logistics',
    badge: 'Planning Window',
    shortDef: 'The time window (e.g., 3 days or 5 days) within which customer orders for the same destination can be grouped together into a single direct shipment.',
    detailedExplanation:
      'By allowing planners to combine order lines arriving within a 3 to 5 day window, individual LTL orders can be merged into cost-saving FTL direct shipments.',
    formulaOrExample: 'Combined Window = [Requested Delivery Date, Requested Delivery Date + Horizon]',
    plannerImpact: 'Longer horizons increase direct dispatch eligibility but require customer alignment on delivery lead-time tolerance.',
  },
  {
    id: 'dc-wh-cost',
    term: 'DC Warehousing Cost per Pallet',
    category: 'costs',
    badge: 'Storage & Handling',
    shortDef: 'The all-inclusive handling, putaway, storage, and pick cost incurred when a pallet enters and dwells inside a regional DC.',
    detailedExplanation:
      'Regional warehouses incur labor, material handling equipment, and pallet storage fees. Direct dispatch completely avoids these fees because pallets never cross the DC threshold.',
    formulaOrExample: 'DC WH Savings = Inbound Unload + Storage Dwell Cost + Outbound Pick/Stage',
    plannerImpact: 'Provides a significant portion (often $15 to $35/pallet) of total net direct dispatch savings.',
  },
  {
    id: 'factory-wh-cost',
    term: 'Factory Staging Cost per Pallet',
    category: 'costs',
    badge: 'Plant Cost',
    shortDef: 'The nominal unit cost to stage and hold direct dispatch pallets at the manufacturing site before loading.',
    detailedExplanation:
      'Holding pallets at the factory dock incurs a minor staging and floor-space utilization cost, which is subtracted from gross DC savings to compute Net Warehousing Savings.',
    formulaOrExample: 'Net WH Savings ($/pallet) = DC WH Cost - Factory Staging Cost',
    plannerImpact: 'Ensures net financial analysis accurately accounts for any plant-side holding overhead.',
  },
  {
    id: 'fill-rate-loss',
    term: 'Fill-Rate Loss / Traditional DC Deficit',
    category: 'capacity',
    badge: 'Risk Metric',
    shortDef: 'The percentage of eligible direct dispatch volume that cannot be fulfilled directly due to plant capacity bottlenecks or inventory stock limits.',
    detailedExplanation:
      'When factory staging capacity is constrained (UseWHCapacityCons = YES) or when production capacity is saturated, some orders are diverted back to the regional DC route, representing a fill-rate loss from the direct route.',
    formulaOrExample: 'Fill-Rate Loss (%) = (Traditional Reverted Pallets ÷ Total Eligible Pallets) × 100',
    plannerImpact: 'Planners monitor this metric to evaluate if plant staging expansions or smoother production scheduling could unlock more savings.',
  },
  {
    id: 'co2-reduction',
    term: 'CO₂ Emission Reduction (kg)',
    category: 'logistics',
    badge: 'Sustainability',
    shortDef: 'Total kilograms of greenhouse gas emissions eliminated by shortening transport routes and avoiding DC detour kilometers.',
    detailedExplanation:
      'Standard road freight emissions average ~0.15 kg CO₂ per pallet-kilometer. Bypassing the intermediate DC eliminates double transit legs and unnecessary road kilometers.',
    formulaOrExample: 'CO₂ Saved (kg) = Pallets Shipped DD × (Primary Km + Secondary Km - DD Km) × 0.15 kg/pallet-km',
    plannerImpact: 'Directly supports corporate ESG carbon neutrality targets and green supply chain reporting.',
  },
  {
    id: 'score',
    term: 'Optimization Score',
    category: 'optimization',
    badge: 'Objective Function',
    shortDef: 'The composite score used by the algorithm to rank and compare competing supply chain policy configurations.',
    detailedExplanation:
      'The objective function balances positive net dollar savings against penalty weights for fill-rate losses and excessive factory inventory buildup.',
    formulaOrExample: 'Score = Net Total Cost Savings - (Loss Penalty × Loss Pallets) - (Stock Penalty × BoF Inventory)',
    plannerImpact: 'Identifies the true Pareto-optimal configuration that maximizes dollar savings while maintaining operational stability.',
  },
];

export const GlossaryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredItems = GLOSSARY_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shortDef.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.detailedExplanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#faf8f4] border border-[#e8e2d8] rounded-xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#b45309] flex items-center justify-center text-white shadow-xs shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Logistics Planner Glossary & Terminology Guide
                </h1>
                <span className="text-[11px] font-semibold bg-[#f5f0e6] text-[#78350f] border border-[#e2d8ca] px-2.5 py-0.5 rounded-full">
                  Supply Chain Reference
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Plain-language explanations of all mathematical formulas, freight rates, optimization policies, and performance KPIs used throughout the Direct Dispatch decision engine.
              </p>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="mt-6 pt-5 border-t border-[#eee7dc] flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search terms, formulas, KPIs..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#e0d8cc] focus:border-[#b45309] focus:ring-2 focus:ring-[#b45309]/20 rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none transition"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Terms', count: GLOSSARY_ITEMS.length },
              { id: 'logistics', label: 'Network & Routing', count: GLOSSARY_ITEMS.filter(i => i.category === 'logistics').length },
              { id: 'costs', label: 'Freight & WH Costs', count: GLOSSARY_ITEMS.filter(i => i.category === 'costs').length },
              { id: 'optimization', label: 'Optimization & Policies', count: GLOSSARY_ITEMS.filter(i => i.category === 'optimization').length },
              { id: 'capacity', label: 'Plant Capacity & Buffer', count: GLOSSARY_ITEMS.filter(i => i.category === 'capacity').length },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-[#b45309] text-white shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-[#faf7f2] border border-[#e0d8cc]'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-[#f0ebe1] text-[#78350f]'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Visual Comparison: Traditional vs Direct Dispatch */}
      <div className="bg-white border border-[#e8e2d8] rounded-xl p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#b45309]" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Network Routing Architecture At A Glance
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Traditional Route Card */}
          <div className="bg-[#faf8f4] border border-[#e8e2d8] rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Traditional 2-Echelon Route
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-[#e0d8cc]">
                High Touchpoints
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-mono bg-white p-2.5 rounded border border-[#e8e2d8]">
              <span className="font-bold text-slate-800">Factory</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-amber-800 font-semibold">[PCPP Freight]</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-800">Regional DC</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-amber-800 font-semibold">[SCPP Freight]</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-800">Customer</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Incurs double transportation costs (PCPP + SCPP), DC putaway/storage/pick fees ($20-$40/p), double handling risk, and extended dwell time.
            </p>
          </div>

          {/* Direct Dispatch Route Card */}
          <div className="bg-[#fcfbf9] border border-[#e2d8ca] rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#b45309]"></span>
                Direct Dispatch (DD) Route
              </span>
              <span className="text-[10px] font-semibold text-[#78350f] bg-[#f5f0e6] border border-[#e2d8ca] px-2 py-0.5 rounded">
                Optimized Single Leg
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 font-mono bg-white p-2.5 rounded border border-[#e8e2d8]">
              <span className="font-bold text-slate-900">Factory</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#b45309]" />
              <span className="text-[#b45309] font-bold">[DDCPP Single-Leg Freight]</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#b45309]" />
              <span className="font-bold text-slate-900">Customer Dock</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Eliminates DC handling entirely, removes secondary linehaul legs, reduces lead time by 2-4 days, and significantly lowers freight carbon footprint.
            </p>
          </div>
        </div>
      </div>

      {/* Glossary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map(item => {
          let categoryColor = 'bg-[#f5f0e6] text-[#78350f] border-[#e2d8ca]';
          let categoryIcon = <Truck className="w-4 h-4 text-[#b45309]" />;

          if (item.category === 'costs') {
            categoryColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            categoryIcon = <DollarSign className="w-4 h-4 text-emerald-600" />;
          } else if (item.category === 'optimization') {
            categoryColor = 'bg-blue-50 text-blue-800 border-blue-200';
            categoryIcon = <Sliders className="w-4 h-4 text-blue-600" />;
          } else if (item.category === 'capacity') {
            categoryColor = 'bg-amber-50 text-amber-900 border-amber-200';
            categoryIcon = <Warehouse className="w-4 h-4 text-amber-600" />;
          }

          return (
            <div
              key={item.id}
              className="bg-white border border-[#e8e2d8] rounded-xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition duration-200 hover:border-[#b45309]"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#faf8f4] border border-[#e8e2d8] flex items-center justify-center shrink-0">
                      {categoryIcon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{item.term}</h3>
                      <span className={`text-[10px] font-semibold px-2 py-0.2 rounded border inline-block mt-0.5 ${categoryColor}`}>
                        {item.badge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Short Def */}
                <p className="text-xs font-semibold text-slate-800 mt-2 leading-relaxed bg-[#faf8f4] p-2.5 rounded-lg border border-[#eee7dc]">
                  {item.shortDef}
                </p>

                {/* Detailed Explanation */}
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  {item.detailedExplanation}
                </p>

                {/* Formula / Code Block */}
                {item.formulaOrExample && (
                  <div className="mt-3 bg-[#faf8f4] border border-[#eee7dc] rounded-lg p-2.5 text-[11px] font-mono text-slate-700 whitespace-pre-line">
                    <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Formula / Logic:
                    </span>
                    {item.formulaOrExample}
                  </div>
                )}
              </div>

              {/* Planner Impact Footer */}
              <div className="mt-4 pt-3 border-t border-[#eee7dc] flex items-start gap-2 text-xs text-slate-700">
                <FileCheck className="w-3.5 h-3.5 text-[#b45309] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Planner Impact: </span>
                  <span className="text-slate-600">{item.plannerImpact}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white border border-[#e8e2d8] rounded-xl p-12 text-center text-slate-500">
          <HelpCircle className="w-8 h-8 text-[#b45309] mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No matching glossary terms found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search keywords or clear the category filter.</p>
        </div>
      )}
    </div>
  );
};
