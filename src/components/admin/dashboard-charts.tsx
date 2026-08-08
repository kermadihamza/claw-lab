"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const BRAND = "#4c6a97";

function formatEUR(n: number) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{label}</p>
      <p className="mt-0.5 text-ink-light">{formatEUR(payload[0].value)}</p>
    </div>
  );
}

export function MonthlyRevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e5e8" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#454c5a" }} axisLine={{ stroke: "#e2e5e8" }} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#454c5a" }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => formatEUR(v)} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f4f5f6" }} />
        <Bar dataKey="revenue" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryRevenueChart({ data }: { data: { category: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e5e8" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: "#454c5a" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatEUR(v)} />
        <YAxis
          type="category"
          dataKey="category"
          tick={{ fontSize: 12, fill: "#454c5a" }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f4f5f6" }} />
        <Bar dataKey="revenue" fill={BRAND} radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
