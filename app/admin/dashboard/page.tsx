export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard Statistik</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-2xl border border-[#E5DEC9]">
          <span className="text-xs text-[#736D69]">Total Penjualan</span>
          <p className="text-2xl font-bold text-[#8E3B24]">Rp 4.250.000</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-[#E5DEC9]">
          <span className="text-xs text-[#736D69]">Total Pesanan</span>
          <p className="text-2xl font-bold text-[#4E6148]">128 Order</p>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-[#E5DEC9]">
          <span className="text-xs text-[#736D69]">Menu Terlaris</span>
          <p className="text-2xl font-bold text-[#2C2623]">Rendang Sapi</p>
        </div>
      </div>
    </div>
  );
}