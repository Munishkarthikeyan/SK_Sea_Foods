import { ReactNode, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { EChartsOption } from 'echarts'
import { supabase } from '../lib/supabase'
import { Order, Product } from '../types'
import EChart from './EChart'

const COLORS = {
  navy: '#0F2A3D',
  slate: '#2F5D74',
  mute: '#6A8FA0',
  sea: '#3FB6C2',
  seaDeep: '#1E7C88',
  gold: '#E2A33D',
  goldDark: '#C7862A',
}
const PALETTE = [
  COLORS.seaDeep,
  COLORS.gold,
  COLORS.slate,
  COLORS.sea,
  COLORS.goldDark,
  COLORS.mute,
  COLORS.navy,
]

const LOW_STOCK_KG = 5

type RangeKey = 'today' | '7d' | '30d' | 'all'
const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: 'today', label: 'Today', days: 1 },
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: 'all', label: 'All time', days: null },
]

const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`
const kg = (n: number) => `${Number(n.toFixed(1))} kg`

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}
function dayLabel(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
function hourLabel(h: number) {
  const twelve = h % 12 === 0 ? 12 : h % 12
  return `${twelve}${h < 12 ? 'AM' : 'PM'}`
}
function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-tide-900/10 bg-white/60 backdrop-blur-[2px] rounded-lg p-4">
      <p className="text-xs uppercase tracking-wide text-tide-400 font-semibold">{label}</p>
      <p className="font-display text-2xl font-bold text-tide-900 mt-1">{value}</p>
      {hint && <p className="text-xs text-tide-400 mt-1">{hint}</p>}
    </div>
  )
}

function Panel({
  title,
  right,
  children,
  className = '',
}: {
  title: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`border border-tide-900/10 bg-white/60 backdrop-blur-[2px] rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="font-display text-base font-bold text-tide-900">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

function Empty({ text = 'No data for this period yet.' }: { text?: string }) {
  return <p className="text-sm text-tide-400 py-16 text-center">{text}</p>
}

function donutOption(data: { name: string; value: number }[]): EChartsOption {
  return {
    color: PALETTE,
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: COLORS.slate } },
    series: [
      {
        type: 'pie',
        radius: ['45%', '68%'],
        center: ['50%', '44%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data,
      },
    ],
  }
}

export default function SalesDashboard() {
  const [range, setRange] = useState<RangeKey>('7d')
  const [itemMetric, setItemMetric] = useState<'revenue' | 'kg'>('revenue')

  const {
    data: orders,
    isLoading: loadingOrders,
    error: ordersError,
  } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Order[]
    },
    refetchInterval: 30000,
  })

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Product[]
    },
  })

  const rangeStart = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)!.days
    if (days === null) return null
    const start = startOfDay(new Date())
    start.setDate(start.getDate() - (days - 1))
    return start
  }, [range])

  // ---- Everything derived from orders in the chosen period ----
  const stats = useMemo(() => {
    const allOrders = orders ?? []
    const list = allOrders.filter((o) => !rangeStart || new Date(o.created_at) >= rangeStart)

    const categoryByName = new Map<string, string>()
    ;(products ?? []).forEach((p) => categoryByName.set(p.name.trim().toLowerCase(), p.category))

    let revenue = 0
    let kgSold = 0
    const byStatus = new Map<string, number>()
    const byPayment = new Map<string, number>()
    const byDay = new Map<string, { revenue: number; orders: number }>()
    const byItem = new Map<string, { kg: number; revenue: number }>()
    const byCategory = new Map<string, number>()
    const byHour: number[] = Array(24).fill(0)

    list.forEach((o) => {
      const created = new Date(o.created_at)
      const total = Number(o.total) || 0
      revenue += total

      byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1)
      const pay = o.payment_method === 'online' ? 'Online' : 'Cash/UPI on delivery'
      byPayment.set(pay, (byPayment.get(pay) ?? 0) + 1)
      byHour[created.getHours()] += 1

      const key = dayKey(created)
      const day = byDay.get(key) ?? { revenue: 0, orders: 0 }
      day.revenue += total
      day.orders += 1
      byDay.set(key, day)

      ;(o.items ?? []).forEach((i) => {
        const qty = Number(i.quantity_kg) || 0
        const amount = qty * (Number(i.price_per_kg) || 0)
        kgSold += qty

        const item = byItem.get(i.name) ?? { kg: 0, revenue: 0 }
        item.kg += qty
        item.revenue += amount
        byItem.set(i.name, item)

        const cat = categoryByName.get(i.name.trim().toLowerCase()) ?? 'Other'
        byCategory.set(cat, (byCategory.get(cat) ?? 0) + amount)
      })
    })

    // One bucket per day (zero-filled) so quiet days still show on the chart.
    const firstDay =
      rangeStart ??
      (allOrders.length
        ? startOfDay(new Date(allOrders[allOrders.length - 1].created_at))
        : startOfDay(new Date()))
    const today = startOfDay(new Date())
    const days: { label: string; revenue: number; orders: number }[] = []
    for (let d = new Date(firstDay); d <= today; d.setDate(d.getDate() + 1)) {
      const v = byDay.get(dayKey(d)) ?? { revenue: 0, orders: 0 }
      days.push({ label: dayLabel(d), ...v })
    }

    return {
      list,
      revenue,
      kgSold,
      avgOrder: list.length ? revenue / list.length : 0,
      pending: byStatus.get('new') ?? 0,
      delivered: byStatus.get('delivered') ?? 0,
      byStatus,
      byPayment,
      byItem,
      byCategory,
      byHour,
      days,
    }
  }, [orders, products, rangeStart])

  // ---- Fish varieties / stock (live, not tied to the date filter) ----
  const stock = useMemo(() => {
    const all = products ?? []
    const soldOut = all.filter((p) => !p.available || p.stock_kg <= 0)
    const live = all.filter((p) => p.available && p.stock_kg > 0)
    const low = live.filter((p) => p.stock_kg <= LOW_STOCK_KG)
    const byCategory = new Map<string, number>()
    all.forEach((p) => byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1))
    return {
      total: all.length,
      live,
      soldOut,
      low,
      byCategory,
      lowest: [...live].sort((a, b) => a.stock_kg - b.stock_kg).slice(0, 10),
    }
  }, [products])

  // ---- Chart options ----
  const trendOption: EChartsOption = useMemo(
    () => ({
      color: [COLORS.seaDeep, COLORS.gold],
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Revenue', 'Orders'], top: 0 },
      grid: { left: 8, right: 8, top: 40, bottom: stats.days.length > 31 ? 40 : 8, containLabel: true },
      dataZoom: stats.days.length > 31 ? [{ type: 'slider', height: 18, bottom: 6 }] : [],
      xAxis: {
        type: 'category',
        data: stats.days.map((d) => d.label),
        axisLabel: { color: COLORS.slate, hideOverlap: true },
      },
      yAxis: [
        {
          type: 'value',
          axisLabel: { color: COLORS.slate, formatter: (v: number) => `₹${v}` },
        },
        { type: 'value', minInterval: 1, splitLine: { show: false }, axisLabel: { color: COLORS.slate } },
      ],
      series: [
        {
          name: 'Revenue',
          type: 'bar',
          data: stats.days.map((d) => Math.round(d.revenue)),
          barMaxWidth: 28,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'Orders',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 6,
          data: stats.days.map((d) => d.orders),
        },
      ],
    }),
    [stats.days]
  )

  const topItems = useMemo(() => {
    return [...stats.byItem.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => (itemMetric === 'revenue' ? b.revenue - a.revenue : b.kg - a.kg))
      .slice(0, 8)
  }, [stats.byItem, itemMetric])

  const topItemsOption: EChartsOption = useMemo(
    () => ({
      color: [COLORS.seaDeep],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = topItems[params[0].dataIndex]
          return `<b>${item.name}</b><br/>${rupees(item.revenue)}<br/>${kg(item.kg)}`
        },
      },
      grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: COLORS.slate,
          formatter: (v: number) => (itemMetric === 'revenue' ? `₹${v}` : `${v}kg`),
        },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: topItems.map((i) => i.name),
        axisLabel: { color: COLORS.navy },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 22,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          data: topItems.map((i) => (itemMetric === 'revenue' ? Math.round(i.revenue) : Number(i.kg.toFixed(1)))),
        },
      ],
    }),
    [topItems, itemMetric]
  )

  const statusData = [...stats.byStatus.entries()].map(([name, value]) => ({
    name: capitalise(name),
    value,
  }))
  const paymentData = [...stats.byPayment.entries()].map(([name, value]) => ({ name, value }))
  const categorySalesData = [...stats.byCategory.entries()].map(([name, value]) => ({
    name,
    value: Math.round(value),
  }))
  const varietyData = [...stock.byCategory.entries()].map(([name, value]) => ({ name, value }))

  const statusOption = useMemo(() => donutOption(statusData), [stats.byStatus])
  const paymentOption = useMemo(() => donutOption(paymentData), [stats.byPayment])
  const categorySalesOption = useMemo(() => donutOption(categorySalesData), [stats.byCategory])
  const varietyOption = useMemo(() => donutOption(varietyData), [stock.byCategory])

  const hourOption: EChartsOption = useMemo(
    () => ({
      color: [COLORS.gold],
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category',
        data: stats.byHour.map((_, h) => hourLabel(h)),
        axisLabel: { color: COLORS.slate, interval: 2 },
      },
      yAxis: { type: 'value', minInterval: 1, axisLabel: { color: COLORS.slate } },
      series: [
        {
          name: 'Orders',
          type: 'bar',
          data: stats.byHour,
          barMaxWidth: 18,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
      ],
    }),
    [stats.byHour]
  )

  const stockOption: EChartsOption = useMemo(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { color: COLORS.slate, formatter: (v: number) => `${v}kg` },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: stock.lowest.map((p) => p.name),
        axisLabel: { color: COLORS.navy },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 20,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          data: stock.lowest.map((p) => ({
            value: p.stock_kg,
            itemStyle: { color: p.stock_kg <= LOW_STOCK_KG ? COLORS.goldDark : COLORS.seaDeep },
          })),
        },
      ],
    }),
    [stock.lowest]
  )

  if (loadingOrders || loadingProducts) return <p className="text-tide-400">Loading dashboard…</p>
  if (ordersError) {
    return <p className="text-red-700 text-sm">Couldn't load sales data. Check your connection and owner login.</p>
  }

  const recent = (orders ?? []).slice(0, 6)

  return (
    <div className="flex flex-col gap-5">
      {/* Period filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-tide-900">Sales dashboard</h1>
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`text-xs sm:text-sm px-3 py-1.5 rounded-full font-semibold transition-colors ${
                range === r.key
                  ? 'bg-tide-900 text-paper'
                  : 'bg-white/70 border border-tide-900/10 text-tide-900 hover:bg-tide-900/5'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sales KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Revenue" value={rupees(stats.revenue)} hint="All orders in period" />
        <KpiCard label="Orders" value={String(stats.list.length)} />
        <KpiCard label="Avg order" value={rupees(stats.avgOrder)} />
        <KpiCard label="Fish sold" value={kg(stats.kgSold)} />
        <KpiCard label="New / pending" value={String(stats.pending)} hint="Waiting for confirmation" />
        <KpiCard label="Delivered" value={String(stats.delivered)} />
      </div>

      {/* Variety KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Fish varieties" value={String(stock.total)} hint="Listed in total" />
        <KpiCard label="Available now" value={String(stock.live.length)} />
        <KpiCard label="Sold out" value={String(stock.soldOut.length)} />
        <KpiCard label="Low stock" value={String(stock.low.length)} hint={`${LOW_STOCK_KG} kg or less`} />
      </div>

      {/* Trend */}
      <Panel title="Sales trend">
        {stats.list.length ? <EChart option={trendOption} height={300} /> : <Empty />}
      </Panel>

      {/* Top fish + order status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel
          title="Top selling fish"
          className="lg:col-span-2"
          right={
            <div className="flex gap-1">
              {(['revenue', 'kg'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setItemMetric(m)}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    itemMetric === m ? 'bg-tide-900 text-paper' : 'border border-tide-900/10'
                  }`}
                >
                  {m === 'revenue' ? '₹ Revenue' : 'Kg sold'}
                </button>
              ))}
            </div>
          }
        >
          {topItems.length ? <EChart option={topItemsOption} height={300} /> : <Empty />}
        </Panel>
        <Panel title="Order status">
          {statusData.length ? <EChart option={statusOption} height={300} /> : <Empty />}
        </Panel>
      </div>

      {/* Category, payment, peak hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel title="Sales by category">
          {categorySalesData.length ? <EChart option={categorySalesOption} /> : <Empty />}
        </Panel>
        <Panel title="Payment method">
          {paymentData.length ? <EChart option={paymentOption} /> : <Empty />}
        </Panel>
        <Panel title="Busiest order hours">
          {stats.list.length ? <EChart option={hourOption} /> : <Empty />}
        </Panel>
      </div>

      {/* Stock + varieties */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel title="Stock left (lowest first)" className="lg:col-span-2">
          {stock.lowest.length ? <EChart option={stockOption} height={300} /> : <Empty text="No fish in stock." />}
        </Panel>
        <Panel title="Varieties by category">
          {varietyData.length ? <EChart option={varietyOption} height={300} /> : <Empty text="No fish listed yet." />}
        </Panel>
      </div>

      {/* Recent orders */}
      <Panel title="Recent orders">
        {recent.length === 0 ? (
          <Empty text="No orders yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-tide-400 border-b border-tide-900/10">
                  <th className="py-1.5 pr-3">Customer</th>
                  <th className="py-1.5 pr-3">When</th>
                  <th className="py-1.5 pr-3">Status</th>
                  <th className="py-1.5 pr-3">Payment</th>
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-tide-900/5">
                    <td className="py-1.5 pr-3">{o.customer_name}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap">
                      {new Date(o.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-1.5 pr-3">{capitalise(o.status)}</td>
                    <td className="py-1.5 pr-3">{o.payment_method === 'online' ? 'Online' : 'COD'}</td>
                    <td className="py-1.5 text-right font-semibold">{rupees(Number(o.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}