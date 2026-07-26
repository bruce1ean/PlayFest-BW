import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { Gamepad2, Car, Users, Sparkles, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { AttendeeRegistration } from '../types';

interface DashboardChartsProps {
  regs: AttendeeRegistration[];
}

export default function DashboardCharts({ regs }: DashboardChartsProps) {
  // 1. Calculate Interest Breakdown
  const gamingOnly = regs.filter(r => {
    const g = (r.interests || []).includes('gaming');
    const c = (r.interests || []).includes('car_meet');
    return g && !c;
  }).length;

  const carOnly = regs.filter(r => {
    const g = (r.interests || []).includes('gaming');
    const c = (r.interests || []).includes('car_meet');
    return c && !g;
  }).length;

  const bothInterests = regs.filter(r => {
    const g = (r.interests || []).includes('gaming');
    const c = (r.interests || []).includes('car_meet');
    return g && c;
  }).length;

  const generalEnthusiast = regs.filter(r => {
    const g = (r.interests || []).includes('gaming');
    const c = (r.interests || []).includes('car_meet');
    return !g && !c;
  }).length;

  const totalInterestsCount = regs.length || 1;

  const interestData = [
    {
      name: 'Gaming Only',
      count: gamingOnly,
      percentage: Math.round((gamingOnly / totalInterestsCount) * 100),
      color: '#22d3ee', // Cyan-400
      shadowColor: 'rgba(34, 211, 238, 0.3)',
      icon: Gamepad2
    },
    {
      name: 'Car Meet Only',
      count: carOnly,
      percentage: Math.round((carOnly / totalInterestsCount) * 100),
      color: '#ec4899', // Pink-500
      shadowColor: 'rgba(236, 72, 153, 0.3)',
      icon: Car
    },
    {
      name: 'Both (Hybrid)',
      count: bothInterests,
      percentage: Math.round((bothInterests / totalInterestsCount) * 100),
      color: '#a855f7', // Purple-500
      shadowColor: 'rgba(168, 85, 247, 0.3)',
      icon: Sparkles
    },
    {
      name: 'General',
      count: generalEnthusiast,
      percentage: Math.round((generalEnthusiast / totalInterestsCount) * 100),
      color: '#94a3b8', // Slate-400
      shadowColor: 'rgba(148, 163, 184, 0.2)',
      icon: Users
    }
  ];

  // 2. VIP & Spend Interest Breakdown for Pie Chart
  const vipYes = regs.filter(r => r.vipInterest === 'Yes').length;
  const vipMaybe = regs.filter(r => r.vipInterest === 'Maybe').length;
  const vipNo = regs.filter(r => r.vipInterest === 'No' || !r.vipInterest).length;

  const vipData = [
    { name: 'VIP Confirmed', value: vipYes, color: '#f59e0b' },   // Amber-500
    { name: 'VIP Maybe', value: vipMaybe, color: '#a855f7' },      // Purple-500
    { name: 'General Pass', value: vipNo, color: '#4b5563' }       // Gray-600
  ].filter(item => item.value > 0);

  // Custom tooltips to match our cyber interface
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-black/95 border border-white/10 p-3.5 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-xs font-mono font-black tracking-wider uppercase text-gray-400 mb-1">
            {data.name}
          </p>
          <div className="flex items-center gap-2">
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: data.color || payload[0].color }} 
            />
            <span className="text-sm font-mono font-bold text-white">
              {payload[0].value} registrants
            </span>
          </div>
          {data.percentage !== undefined && (
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
              Share: {data.percentage}% of database
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Bar Chart: Interest Breakdown */}
      <div className="lg:col-span-2 bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 font-display">
                  Interest Spectrum Analysis
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Distribution of registrants across core festival pillars.</p>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={interestData}
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
              >
                <XAxis 
                  dataKey="name" 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  fontFamily="monospace"
                />
                <YAxis 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  fontFamily="monospace"
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {interestData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      style={{ filter: `drop-shadow(0 2px 8px ${entry.shadowColor})` }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend Grid with metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-5 mt-4 border-t border-white/5">
          {interestData.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-3 bg-black/20 rounded-xl border border-white/5 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono font-semibold">
                  <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-lg font-mono font-black text-white">{item.count}</span>
                  <span className="text-[10px] text-gray-500 font-mono">({item.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pie Chart: VIP Interest Breakdown */}
      <div className="lg:col-span-1 bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-pink-400 font-display">
                Premium Cohorts
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">VIP ticket demand & premium tier allocation.</p>
            </div>
          </div>

          <div className="h-56 w-full flex items-center justify-center relative mt-4">
            {regs.length === 0 ? (
              <div className="text-xs font-mono text-gray-500 italic">No registrant records available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vipData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {vipData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            
            {/* Center Label inside Donut */}
            {regs.length > 0 && (
              <div className="absolute text-center flex flex-col justify-center items-center pointer-events-none">
                <span className="text-2xl font-black font-mono text-white leading-none">
                  {Math.round(((vipYes + vipMaybe) / totalInterestsCount) * 100)}%
                </span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-gray-500 mt-1">
                  High Intent
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-2 pt-4 mt-2 border-t border-white/5">
          {vipData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs font-mono p-2 bg-black/20 rounded-lg border border-white/5">
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{item.value}</span>
                <span className="text-[10px] text-gray-500">
                  ({Math.round((item.value / totalInterestsCount) * 100)}%)
                </span>
              </div>
            </div>
          ))}
          {vipData.length === 0 && (
            <div className="text-[10px] font-mono text-gray-500 italic text-center py-2">
              Awaiting telemetry synchronization...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
