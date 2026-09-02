'use client';

import React, { useState } from 'react';
import Image from 'next/image';

type MenuItemAdmin = {
  id: string;
  name: string;
  category: 'Makanan Utama' | 'Minuman' | 'Cemilan';
  price: number;
  description: string;
  image: string;
  isAvailable: boolean;
  isPopular?: boolean;
};

const INITIAL_MENU: MenuItemAdmin[] = [
  {
    id: 'm1',
    name: 'Nasi Rendang Sapi Premium',
    category: 'Makanan Utama',
    price: 32000,
    description: 'Daging sapi pilihan dimasak rempah khas Padang selama 8 jam.',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: true,
  },
  {
    id: 'm2',
    name: 'Ayam Balado Sambal Merah',
    category: 'Makanan Utama',
    price: 26000,
    description: 'Ayam goreng empuk dilumuri sambal balado pedas gurih.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
  },
  {
    id: 'm3',
    name: 'Nasi Ayam Geprek Sambal Ijo',
    category: 'Makanan Utama',
    price: 22000,
    description: 'Ayam krispi gurih dengan ulekan sambal ijo super pedas.',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: true,
  },
  {
    id: 'm4',
    name: 'Es Kopi Susu Gula Aren',
    category: 'Minuman',
    price: 18000,
    description: 'Espresso robusta dengan susu segar dan gula aren asli.',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
    isPopular: true,
  },
  {
    id: 'm5',
    name: 'Es Jeruk Peras Segar',
    category: 'Minuman',
    price: 10000,
    description: 'Perasan jeruk segar alami penyegar tenggorokan.',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
    isAvailable: true,
  },
  {
    id: 'm6',
    name: 'Pisang Goreng Keju Cokelat',
    category: 'Cemilan',
    price: 16000,
    description: 'Pisang raja renyah ditaburi keju parut dan meises cokelat.',
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
    isAvailable: false,
  },
];

export default function MenuManagerPage() {
  const [menuList, setMenuList] = useState<MenuItemAdmin[]>(INITIAL_MENU);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemAdmin | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Makanan Utama' as MenuItemAdmin['category'],
    price: '',
    description: '',
    image: '',
    isPopular: false,
    isAvailable: true,
  });

  // Reset & Open Modal Create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Makanan Utama',
      price: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      isPopular: false,
      isAvailable: true,
    });
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEditModal = (item: MenuItemAdmin) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      image: item.image,
      isPopular: !!item.isPopular,
      isAvailable: item.isAvailable,
    });
    setIsModalOpen(true);
  };

  // Toggle Availability
  const handleToggleStatus = (id: string) => {
    setMenuList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  // Delete Item
  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
      setMenuList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Save Form (Create/Update)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(formData.price) || 0;

    if (editingItem) {
      // Update
      setMenuList((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                name: formData.name,
                category: formData.category,
                price: priceNum,
                description: formData.description,
                image: formData.image || item.image,
                isPopular: formData.isPopular,
                isAvailable: formData.isAvailable,
              }
            : item
        )
      );
    } else {
      // Create
      const newItem: MenuItemAdmin = {
        id: `m-${Date.now()}`,
        name: formData.name,
        category: formData.category,
        price: priceNum,
        description: formData.description,
        image: formData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        isPopular: formData.isPopular,
        isAvailable: formData.isAvailable,
      };
      setMenuList((prev) => [newItem, ...prev]);
    }

    setIsModalOpen(false);
  };

  // Filter Search & Category
  const filteredMenu = menuList.filter((item) => {
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeCount = menuList.filter((m) => m.isAvailable).length;
  const outOfStockCount = menuList.filter((m) => !m.isAvailable).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2C2623] tracking-tight">Menu Manager</h1>
          <p className="text-sm text-[#736D69] mt-1">Daftar dan kelola seluruh item menu restoran Anda.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#8E3B24] hover:bg-[#78301B] text-white py-2.5 px-5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+</span> Tambah Menu Baru
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5DEC9] shadow-sm">
          <span className="text-xs font-bold text-[#736D69] uppercase tracking-wider">Total Menu</span>
          <p className="text-2xl font-black text-[#2C2623] mt-1">{menuList.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5DEC9] shadow-sm">
          <span className="text-xs font-bold text-[#4E6148] uppercase tracking-wider">Menu Aktif</span>
          <p className="text-2xl font-black text-[#4E6148] mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5DEC9] shadow-sm">
          <span className="text-xs font-bold text-[#C0392B] uppercase tracking-wider">Stok Kosong</span>
          <p className="text-2xl font-black text-[#C0392B] mt-1">{outOfStockCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#E5DEC9] shadow-sm">
          <span className="text-xs font-bold text-[#8E3B24] uppercase tracking-wider">Rata-rata Harga</span>
          <p className="text-2xl font-black text-[#2C2623] mt-1">
            Rp {Math.round(menuList.reduce((acc, curr) => acc + curr.price, 0) / (menuList.length || 1)).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5DEC9] shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-full py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-[#6B7C5E]"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['Semua', 'Makanan Utama', 'Minuman', 'Cemilan'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#6B7C5E] text-white shadow-sm'
                  : 'bg-[#F2EDE4] text-[#524D4A] hover:bg-[#E4DCCF]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Data Table */}
      <div className="bg-white rounded-3xl border border-[#E5DEC9] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2EDE4] text-[#2C2623] font-bold border-b border-[#E5DEC9]">
              <tr>
                <th className="p-4">Item Menu</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Harga</th>
                <th className="p-4">Status Stok</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DEC9]">
              {filteredMenu.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#736D69]">
                    Tidak ada menu yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredMenu.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-[#E5DEC9]">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-[#2C2623] text-sm flex items-center gap-1.5">
                            <span>{item.name}</span>
                            {item.isPopular && (
                              <span className="bg-[#8E3B24] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                Favorit
                              </span>
                            )}
                          </div>
                          <p className="text-[#736D69] text-[11px] line-clamp-1 max-w-xs mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-[#F2EDE4] text-[#524D4A] font-semibold px-2.5 py-1 rounded-full text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-[#2C2623]">
                      Rp {item.price.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(item.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                          item.isAvailable
                            ? 'bg-[#EAEFE8] text-[#4E6148] hover:bg-emerald-200'
                            : 'bg-[#FDECEB] text-[#C0392B] hover:bg-red-200'
                        }`}
                      >
                        {item.isAvailable ? '● Tersedia' : '○ Stok Kosong'}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="text-xs font-bold text-blue-600 hover:underline px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-xs font-bold text-red-600 hover:underline px-2 py-1"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 border border-[#E5DEC9] shadow-xl">
            <div className="flex items-center justify-between border-b pb-3 border-[#E5DEC9]">
              <h3 className="font-bold text-lg text-[#2C2623]">
                {editingItem ? 'Edit Item Menu' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#736D69] block mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Nasi Ayam Geprek Sambal Matah"
                  className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#6B7C5E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#736D69] block mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MenuItemAdmin['category'] })}
                    className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#6B7C5E]"
                  >
                    <option value="Makanan Utama">Makanan Utama</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Cemilan">Cemilan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#736D69] block mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="25000"
                    className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#6B7C5E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#736D69] block mb-1">URL Gambar (Unsplash/Direct Image)</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#6B7C5E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#736D69] block mb-1">Deskripsi Menu</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan bahan atau cita rasa..."
                  className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#6B7C5E] resize-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="rounded text-[#8E3B24]"
                  />
                  <span>Tandai Menu Favorit</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="rounded text-[#4E6148]"
                  />
                  <span>Stok Tersedia</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E5DEC9]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-gray-300 text-xs font-semibold hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#8E3B24] text-white text-xs font-bold hover:bg-[#78301B]"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}