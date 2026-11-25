import React, { createElement, useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaChartLine, FaFileCsv, FaFilter, FaMoneyBill, FaPrint, FaReceipt, FaSearch, FaSyncAlt, FaTags, FaUserTie } from 'react-icons/fa';
import toast from 'react-hot-toast';
import reportService from '../services/reportService';

const toDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitialDates = () => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 29);
  return { start_date: toDateInput(start), end_date: toDateInput(end) };
};

const currency = (value) => `₦${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateTime = (value) => value ? new Date(value).toLocaleString() : '—';
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const MetricCard = ({ title, value, caption, icon: Icon, tone = 'emerald' }) => {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
          <p className="mt-2 text-xl font-black tabular-nums text-slate-900">{value}</p>
          {caption && <p className="mt-1 text-[10px] font-bold text-slate-400">{caption}</p>}
        </div>
        <span className={`rounded-xl p-2.5 ${tones[tone] || tones.emerald}`}>{createElement(Icon)}</span>
      </div>
    </article>
  );
};

const SalesReport = () => {
  const initialDates = useMemo(() => getInitialDates(), []);
  const [draftFilters, setDraftFilters] = useState({ ...initialDates, sale_type: 'all', payment_method: '', staff: '', product: '', search: '' });
  const [appliedFilters, setAppliedFilters] = useState({ ...initialDates, sale_type: 'all', payment_method: '', staff: '', product: '', search: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const params = Object.fromEntries(Object.entries(appliedFilters).filter(([, value]) => value !== '' && value !== null));
    reportService.getSalesReport({ params, signal: controller.signal })
      .then(({ data }) => setReport(data))
      .catch((error) => {
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
          toast.error(error.response?.data?.detail || 'Could not load sales report.');
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [appliedFilters]);

  const summary = report?.summary || {};
  const sales = report?.sales || [];
  const canSeeProfit = Boolean(report?.include_profit);
  const trend = report?.trend || [];
  const topTrend = trend.slice(-14);
  const maxTrend = Math.max(1, ...topTrend.map((point) => Number(point.net_sales || 0)));

  const updateDraft = (event) => setDraftFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const applyFilters = (event) => {
    event.preventDefault();
    if (draftFilters.start_date && draftFilters.end_date && draftFilters.start_date > draftFilters.end_date) {
      toast.error('Start date must be on or before end date.');
      return;
    }
    setLoading(true);
    setAppliedFilters({ ...draftFilters });
  };
  const selectDateRange = (days) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    const dates = { start_date: toDateInput(start), end_date: toDateInput(end) };
    setLoading(true);
    setDraftFilters((current) => ({ ...current, ...dates }));
    setAppliedFilters((current) => ({ ...current, ...dates }));
  };

  const exportCSV = () => {
    if (!sales.length) {
      toast.error('There are no transactions in the current report to export.');
      return;
    }
    const headers = [
      'Transaction ID', 'Date', 'Sale type', 'Customer', 'Staff', 'Payment method',
      'Items', 'Quantity', 'Tax-inclusive total', 'Pre-tax sales subtotal', 'Refunds', 'Net sales',
      ...(canSeeProfit ? ['Cost of goods sold', 'Gross profit', 'Cost status'] : []),
    ];
    const rows = sales.map((sale) => [
      sale.transaction_id,
      dateTime(sale.created_at),
      sale.sale_type,
      sale.customer_name,
      sale.staff_name,
      sale.payment_method,
      (sale.items || []).map((item) => `${item.name} x ${item.quantity}`).join('; '),
      sale.quantity,
      sale.total_amount,
      sale.sales_subtotal,
      sale.refund_amount,
      sale.net_sales,
      ...(canSeeProfit ? [sale.cost_of_goods_sold ?? 'Unknown', sale.gross_profit ?? 'Unknown', sale.cost_complete ? 'Costed' : 'Uncosted'] : []),
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pharmacypos-sales-report-${appliedFilters.start_date || 'all'}-to-${appliedFilters.end_date || 'all'}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sales-report min-h-full bg-slate-50 text-sm">
      <style>{`@media print { @page { size: landscape; margin: 12mm; } body { background: white !important; } .sales-report { background: white !important; } .no-print { display: none !important; } .print-break { break-inside: avoid; } .sales-report table { font-size: 9px; } .sales-report th, .sales-report td { padding: 5px !important; } .sales-report main { overflow: visible !important; padding: 0 !important; } }`}</style>
      <header className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">PharmacyPOS · Analytics</p>
          <h1 className="mt-1 text-lg font-black uppercase tracking-tight text-slate-900">Sales &amp; Profit Reports</h1>
          <p className="mt-1 text-xs font-medium text-slate-500">Review both sales channels, refunds, margins, and transaction details.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setLoading(true); setAppliedFilters({ ...draftFilters }); }} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"><FaSyncAlt className="mr-2 inline" />Refresh</button>
          <button onClick={exportCSV} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700"><FaFileCsv className="mr-2 inline" />Export CSV</button>
          <button onClick={() => window.print()} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-black text-white hover:bg-slate-800"><FaPrint className="mr-2 inline" />Print / Save PDF</button>
        </div>
      </header>

      <main className="space-y-5 p-4 md:p-6">
        <section className="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-700"><FaFilter className="text-emerald-600" /><h2 className="text-xs font-black uppercase tracking-widest">Report filters</h2></div>
            <div className="flex gap-2">
              <button onClick={() => selectDateRange(7)} className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">7 days</button>
              <button onClick={() => selectDateRange(30)} className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">30 days</button>
            </div>
          </div>
          <form onSubmit={applyFilters} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">From
              <span className="relative mt-1 block"><FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="date" name="start_date" value={draftFilters.start_date} onChange={updateDraft} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-2 text-xs font-bold text-slate-700" /></span>
            </label>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">To
              <span className="relative mt-1 block"><FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="date" name="end_date" value={draftFilters.end_date} onChange={updateDraft} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-2 text-xs font-bold text-slate-700" /></span>
            </label>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Sales channel
              <select name="sale_type" value={draftFilters.sale_type} onChange={updateDraft} className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"><option value="all">All channels</option><option value="pharmacy">Pharmacy</option><option value="supermarket">Supermarket</option></select>
            </label>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Payment
              <input name="payment_method" value={draftFilters.payment_method} onChange={updateDraft} placeholder="Cash, card…" className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700" />
            </label>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Staff name
              <input name="staff" value={draftFilters.staff} onChange={updateDraft} placeholder="Name contains…" className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700" />
            </label>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Product
              <input name="product" value={draftFilters.product} onChange={updateDraft} placeholder="Product name" className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700" />
            </label>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Search
              <span className="relative mt-1 block"><FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input name="search" value={draftFilters.search} onChange={updateDraft} placeholder="Receipt, customer, staff" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-2 text-xs font-bold text-slate-700" /></span>
            </label>
            <div className="sm:col-span-2 xl:col-span-7"><button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700"><FaFilter className="mr-2 inline" />Run report</button></div>
          </form>
        </section>

        {canSeeProfit && summary.uncosted_sales > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 print-break">
            <FaTags className="mt-0.5 shrink-0" />
            <p><strong>Cost coverage notice:</strong> {summary.uncosted_sales} transaction(s) have one or more items without a saved sale-time cost. They remain included in sales totals but are excluded from cost, profit, and margin calculations. Enter purchase costs on products for future sales; older sales are not backfilled.</p>
          </div>
        )}

        {loading && <div className="rounded-xl bg-white p-4 text-xs font-bold text-slate-500">Loading report…</div>}
        {!loading && report && (
          <>
            <section className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${canSeeProfit ? 'xl:grid-cols-6' : 'xl:grid-cols-4'}`}>
              <MetricCard title="Net sales" value={currency(summary.net_sales)} caption="Pre-tax line sales less recorded refunds" icon={FaMoneyBill} tone="emerald" />
              <MetricCard title="Transaction total" value={currency(summary.total_amount)} caption="Includes taxes as recorded at checkout" icon={FaReceipt} tone="blue" />
              <MetricCard title="Transactions" value={Number(summary.transaction_count || 0).toLocaleString()} caption={`${Number(summary.units_sold || 0).toLocaleString()} units sold`} icon={FaChartLine} tone="violet" />
              <MetricCard title="Average ticket" value={currency(summary.average_transaction_value)} caption="Average tax-inclusive sale" icon={FaUserTie} tone="amber" />
              {canSeeProfit && <MetricCard title="Gross profit" value={currency(summary.gross_profit)} caption="Fully costed sales only" icon={FaMoneyBill} tone="emerald" />}
              {canSeeProfit && <MetricCard title="Gross margin" value={summary.gross_margin_percent == null ? '—' : `${Number(summary.gross_margin_percent).toFixed(2)}%`} caption={`${summary.cost_coverage_percent}% of transactions fully costed`} icon={FaTags} tone="rose" />}
            </section>

            {canSeeProfit && <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetricCard title="Recorded refunds" value={currency(summary.refunds)} caption="Deducted from pharmacy product sales" icon={FaReceipt} tone="rose" />
              <MetricCard title="Cost of goods sold" value={currency(summary.cost_of_goods_sold)} caption={`${summary.costed_sales} fully costed transactions`} icon={FaTags} tone="blue" />
              <MetricCard title="Costed sales base" value={currency(summary.costed_net_sales)} caption={`${summary.uncosted_sales} transaction(s) uncosted`} icon={FaMoneyBill} tone="amber" />
            </section>}

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <article className="print-break rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
                <div className="mb-4 flex items-center justify-between"><div><h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Daily net sales</h2><p className="mt-1 text-[10px] font-medium text-slate-400">Each column is one date with recorded transactions</p></div><FaChartLine className="text-emerald-600" /></div>
                {topTrend.length ? <div className="flex h-40 items-end gap-1 border-b border-slate-100 pb-1">
                  {topTrend.map((point) => {
                    const height = Math.max(4, Number(point.net_sales || 0) / maxTrend * 100);
                    return <div key={point.date} className="group relative flex h-full min-w-0 flex-1 items-end justify-center" title={`${point.date}: ${currency(point.net_sales)}`}>
                      <div className="w-full max-w-8 rounded-t-md bg-emerald-500 transition-colors group-hover:bg-emerald-700" style={{ height: `${height}%` }} />
                      <span className="absolute -bottom-5 whitespace-nowrap text-[8px] font-bold text-slate-400">{point.date.slice(5)}</span>
                    </div>;
                  })}
                </div> : <p className="py-10 text-center text-xs font-medium text-slate-400">No sales for the selected dates.</p>}
                <p className="mt-8 text-right text-[10px] font-bold text-slate-400">{trend.length} date(s) with activity</p>
              </article>
              <article className="print-break rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-800">By sales channel</h2>
                <div className="space-y-3">{(report.by_type || []).map((row) => <div key={row.sale_type} className="flex items-center justify-between rounded-lg bg-slate-50 p-3"><div><p className="text-xs font-black capitalize text-slate-700">{row.sale_type}</p><p className="mt-1 text-[10px] font-medium text-slate-400">{row.transactions} transactions</p></div><p className="text-xs font-black tabular-nums text-slate-900">{currency(row.net_sales)}</p></div>)}{!report.by_type?.length && <p className="text-xs text-slate-400">No channel activity for these filters.</p>}</div>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <article className="print-break rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-800">Payment methods</h2>
                <div className="space-y-2">{(report.by_payment_method || []).map((row) => <div key={row.payment_method} className="flex items-center justify-between border-b border-slate-100 py-2"><span className="text-xs font-bold text-slate-600">{row.payment_method}</span><span className="text-xs font-black tabular-nums text-slate-900">{currency(row.net_sales)}</span></div>)}{!report.by_payment_method?.length && <p className="text-xs text-slate-400">No payment data available.</p>}</div>
              </article>
              <article className="print-break rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-800">Staff performance</h2>
                <div className="max-h-64 space-y-2 overflow-auto">{(report.by_staff || []).map((row) => <div key={row.staff_name} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2"><div><p className="text-xs font-bold text-slate-700">{row.staff_name}</p><p className="text-[10px] text-slate-400">{row.transactions} transactions</p></div><span className="text-xs font-black tabular-nums text-slate-900">{currency(row.net_sales)}</span></div>)}{!report.by_staff?.length && <p className="text-xs text-slate-400">No staff data available.</p>}</div>
              </article>
              <article className="print-break rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-800">Top products</h2>
                <div className="max-h-64 space-y-2 overflow-auto">{(report.top_products || []).slice(0, 12).map((row) => <div key={`${row.sale_type}-${row.name}`} className="border-b border-slate-100 py-2"><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-bold text-slate-700">{row.name}</span><span className="shrink-0 text-[10px] font-black text-slate-500">×{row.net_quantity}</span></div><div className="mt-1 flex items-center justify-between text-[10px] text-slate-400"><span className="capitalize">{row.sale_type}</span><span>{currency(row.sales_subtotal)}</span></div></div>)}{!report.top_products?.length && <p className="text-xs text-slate-400">No product data available.</p>}</div>
              </article>
            </section>

            <section className="print-break overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <div><h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Transaction details</h2><p className="mt-1 text-[10px] text-slate-400">{sales.length} matching sale(s) · sorted newest first</p></div>
                <div className="no-print flex gap-2"><button onClick={exportCSV} className="rounded-md bg-emerald-600 px-3 py-1.5 text-[10px] font-black text-white"><FaFileCsv className="mr-1 inline" />CSV</button><button onClick={() => window.print()} className="rounded-md bg-slate-800 px-3 py-1.5 text-[10px] font-black text-white"><FaPrint className="mr-1 inline" />PDF / Print</button></div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead className="bg-slate-50"><tr>{['Transaction / date', 'Channel', 'Customer', 'Staff', 'Items', 'Total / net sales', ...(canSeeProfit ? ['COGS / profit'] : [])].map((heading) => <th key={heading} className="whitespace-nowrap px-3 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500">{heading}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {sales.map((sale) => <tr key={`${sale.sale_type}-${sale.id}`} className="align-top hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-3"><p className="text-[11px] font-black text-slate-800">{sale.transaction_id}</p><p className="mt-1 text-[9px] text-slate-400">{dateTime(sale.created_at)}</p></td>
                      <td className="px-3 py-3 text-[10px] font-bold capitalize text-slate-600">{sale.sale_type}</td>
                      <td className="px-3 py-3 text-[10px] font-semibold text-slate-700">{sale.customer_name}</td>
                      <td className="px-3 py-3 text-[10px] text-slate-600">{sale.staff_name}</td>
                      <td className="min-w-40 px-3 py-3 text-[10px] text-slate-600">{(sale.items || []).map((item) => <p key={`${item.name}-${item.quantity}`}>{item.name} × {item.quantity}</p>)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right"><p className="text-[10px] font-bold text-slate-700">{currency(sale.total_amount)} total</p><p className="mt-1 text-[10px] font-black text-emerald-700">{currency(sale.net_sales)} net</p>{Number(sale.refund_amount) > 0 && <p className="text-[9px] text-rose-600">Refund {currency(sale.refund_amount)}</p>}</td>
                      {canSeeProfit && <td className="whitespace-nowrap px-3 py-3 text-right">{sale.cost_complete ? <><p className="text-[10px] text-slate-600">{currency(sale.cost_of_goods_sold)} cost</p><p className="mt-1 text-[10px] font-black text-blue-700">{currency(sale.gross_profit)} profit</p></> : <span className="rounded-full bg-amber-50 px-2 py-1 text-[9px] font-black uppercase text-amber-700">Uncosted</span>}</td>}
                    </tr>)}
                    {!sales.length && <tr><td colSpan={canSeeProfit ? 7 : 6} className="px-4 py-12 text-center text-xs font-medium text-slate-400">No sales match these filters.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default SalesReport;
