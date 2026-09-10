'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient'; // Sesuaikan dengan lokasi file client supabase kamu

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

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

export default function MenuManagerPage() {
  const [menuList, setMenuList] = useState<MenuItemAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // 1. FETCH DATA DARI SUPABASE
  const fetchMenu = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal mengambil data dari Supabase:', error.message);
    } else if (data) {
      // Mapping dari kolom Supabase (snake_case) ke format Frontend (camelCase)
      const formattedData: MenuItemAdmin[] = data.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: Number(item.price),
        description: item.description || '',
        image: item.image || DEFAULT_IMAGE,
        isAvailable: item.is_available ?? true,
        isPopular: item.is_popular ?? false,
      }));
      setMenuList(formattedData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Reset & Open Modal Create
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Makanan Utama',
      price: '',
      description: '',
      image: '',
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

  // Upload Gambar dari File Lokal (Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. TOGGLE STATUS STOK DI SUPABASE
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic Update tampilan
    setMenuList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isAvailable: !currentStatus } : item))
    );

    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !currentStatus })
      .eq('id', id);

    if (error) {
      alert('Gagal memperbarui status: ' + error.message);
      fetchMenu(); // Revert data jika gagal
    }
  };

  // 3. HAPUS MENU DARI SUPABASE
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${name}"?`)) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);

      if (error) {
        alert('Gagal menghapus menu: ' + error.message);
      } else {
        fetchMenu();
      }
    }
  };

  // 4. SIMPAN FORM (CREATE / UPDATE) KE SUPABASE
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(formData.price) || 0;
    const finalImage = formData.image.trim() !== '' ? formData.image : DEFAULT_IMAGE;

    const payload = {
      name: formData.name,
      category: formData.category,
      price: priceNum,
      description: formData.description,
      image: finalImage,
      is_popular: formData.isPopular,
      is_available: formData.isAvailable,
    };

    if (editingItem) {
      // UPDATE
      const { error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) {
        alert('Gagal mengedit menu: ' + error.message);
        return;
      }
    } else {
      // INSERT (Tambah Menu Baru)
      const { error } = await supabase
        .from('menu_items')
        .insert([payload]);

      if (error) {
        alert('Gagal menambah menu: ' + error.message);
        return;
      }
    }

    setIsModalOpen(false);
    fetchMenu(); // Re-fetch data terbaru dari Supabase
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
    <div className="w-full max-w-[1800px] mx-auto space-y-6 xl:space-y-8 2xl:space-y-10 text-[#2C2623] p-2 sm:p-4 xl:p-6">
      {/* TITLE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DEC9] pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl xl:text-4xl 2xl:text-5xl font-extrabold text-[#2C2623] tracking-tight">
            Menu Manager
          </h1>
          <p className="text-xs xl:text-sm 2xl:text-base text-[#736D69] mt-1">
            Daftar dan kelola seluruh item menu restoran Anda secara real-time.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#8E3B24] hover:bg-[#78301B] text-white py-2.5 xl:py-3 px-5 xl:px-7 rounded-full text-xs xl:text-sm font-bold transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <span>+</span> Tambah Menu Baru
        </button>
      </div>

      {/* SUMMARY METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-6 2xl:gap-8">
        <div className="bg-white p-5 xl:p-7 2xl:p-8 rounded-2xl xl:rounded-3xl border border-[#E5DEC9] shadow-xs">
          <span className="text-xs xl:text-sm font-bold text-[#736D69] uppercase tracking-wider">Total Menu</span>
          <p className="text-2xl xl:text-3xl 2xl:text-4xl font-black text-[#2C2623] mt-1">{menuList.length}</p>
        </div>
        <div className="bg-white p-5 xl:p-7 2xl:p-8 rounded-2xl xl:rounded-3xl border border-[#E5DEC9] shadow-xs">
          <span className="text-xs xl:text-sm font-bold text-[#4E6148] uppercase tracking-wider">Menu Aktif</span>
          <p className="text-2xl xl:text-3xl 2xl:text-4xl font-black text-[#4E6148] mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-5 xl:p-7 2xl:p-8 rounded-2xl xl:rounded-3xl border border-[#E5DEC9] shadow-xs">
          <span className="text-xs xl:text-sm font-bold text-[#C0392B] uppercase tracking-wider">Stok Kosong</span>
          <p className="text-2xl xl:text-3xl 2xl:text-4xl font-black text-[#C0392B] mt-1">{outOfStockCount}</p>
        </div>
        <div className="bg-white p-5 xl:p-7 2xl:p-8 rounded-2xl xl:rounded-3xl border border-[#E5DEC9] shadow-xs">
          <span className="text-xs xl:text-sm font-bold text-[#8E3B24] uppercase tracking-wider">Rata-rata Harga</span>
          <p className="text-2xl xl:text-3xl 2xl:text-4xl font-black text-[#2C2623] mt-1">
            Rp {Math.round(menuList.reduce((acc, curr) => acc + curr.price, 0) / (menuList.length || 1)).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="bg-white p-4 xl:p-6 rounded-2xl xl:rounded-3xl border border-[#E5DEC9] shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80 xl:w-96">
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-full py-2 xl:py-2.5 pl-9 pr-4 text-xs xl:text-sm focus:outline-none focus:ring-1 focus:ring-[#6B7C5E]"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 xl:top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['Semua', 'Makanan Utama', 'Minuman', 'Cemilan'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 xl:px-5 py-1.5 xl:py-2 rounded-full text-xs xl:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#6B7C5E] text-white shadow-xs'
                  : 'bg-[#F2EDE4] text-[#524D4A] hover:bg-[#E4DCCF]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* MENU DATA TABLE */}
      <div className="bg-white rounded-3xl border border-[#E5DEC9] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs xl:text-sm">
            <thead className="bg-[#F2EDE4] text-[#2C2623] font-bold border-b border-[#E5DEC9]">
              <tr>
                <th className="p-4 xl:p-5">Item Menu</th>
                <th className="p-4 xl:p-5">Kategori</th>
                <th className="p-4 xl:p-5">Harga</th>
                <th className="p-4 xl:p-5">Status Stok</th>
                <th className="p-4 xl:p-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DEC9]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#736D69] font-medium">
                    Memuat data menu dari Supabase...
                  </td>
                </tr>
              ) : filteredMenu.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#736D69]">
                    Tidak ada menu yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredMenu.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="p-4 xl:p-5">
                      <div className="flex items-center gap-3 xl:gap-4">
                        <div className="relative w-12 h-12 xl:w-14 xl:h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-[#E5DEC9]">
                          <Image
                            src={item.image || DEFAULT_IMAGE}
                            alt={item.name}
                            fill
                            unoptimized
                            sizes="60px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-[#2C2623] text-sm xl:text-base flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.isPopular && (
                              <span className="bg-[#8E3B24] text-white text-[9px] xl:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                Favorit
                              </span>
                            )}
                          </div>
                          <p className="text-[#736D69] text-[11px] xl:text-xs line-clamp-1 max-w-xs xl:max-w-md mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 xl:p-5">
                      <span className="bg-[#F2EDE4] text-[#524D4A] font-semibold px-3 py-1 rounded-full text-[11px] xl:text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 xl:p-5 font-bold text-[#2C2623] text-xs xl:text-sm">
                      Rp {item.price.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 xl:p-5">
                      <button
                        onClick={() => handleToggleStatus(item.id, item.isAvailable)}
                        className={`px-3 py-1.5 rounded-full text-[10px] xl:text-xs font-bold transition-all cursor-pointer ${
                          item.isAvailable
                            ? 'bg-[#EAEFE8] text-[#4E6148] hover:bg-emerald-200'
                            : 'bg-[#FDECEB] text-[#C0392B] hover:bg-red-200'
                        }`}
                      >
                        {item.isAvailable ? '● Tersedia' : '○ Stok Kosong'}
                      </button>
                    </td>
                    <td className="p-4 xl:p-5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="text-xs xl:text-sm font-bold text-blue-600 hover:underline px-2 py-1 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-xs xl:text-sm font-bold text-red-600 hover:underline px-2 py-1 cursor-pointer"
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

      {/* MODAL ADD / EDIT FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 xl:p-8 max-w-lg xl:max-w-xl w-full space-y-4 border border-[#E5DEC9] shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-[#E5DEC9]">
              <h3 className="font-bold text-lg xl:text-xl text-[#2C2623]">
                {editingItem ? 'Edit Item Menu' : 'Tambah Menu Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Nasi Ayam Geprek Sambal Matah"
                  className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2.5 xl:p-3 text-xs xl:text-sm focus:outline-none focus:ring-1 focus:ring-[#6B7C5E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MenuItemAdmin['category'] })}
                    className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2.5 xl:p-3 text-xs xl:text-sm focus:outline-none focus:ring-1 focus:ring-[#6B7C5E]"
                  >
                    <option value="Makanan Utama">Makanan Utama</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Cemilan">Cemilan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="25000"
                    className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2.5 xl:p-3 text-xs xl:text-sm focus:outline-none focus:ring-1 focus:ring-[#6B7C5E]"
                  />
                </div>
              </div>

              {/* INPUT GAMBAR */}
              <div className="space-y-2">
                <label className="text-xs xl:text-sm font-bold text-[#736D69] block">Gambar Menu</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-[#736D69] block mb-1">Upload File Foto:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-[#736D69] file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#8E3B24] file:text-white hover:file:bg-[#78301B] cursor-pointer"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-[#736D69] block mb-1">Atau URL Gambar:</span>
                    <input
                      type="url"
                      value={formData.image.startsWith('data:') ? '' : formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2 xl:p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#6B7C5E]"
                    />
                  </div>
                </div>

                {/* PREVIEW GAMBAR */}
                {formData.image && (
                  <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-[#E5DEC9]">
                    <Image
                      src={formData.image}
                      alt="Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs xl:text-sm font-bold text-[#736D69] block mb-1">Deskripsi Menu</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Keterangan bahan atau cita rasa..."
                  className="w-full bg-[#FDFBF7] border border-[#E5DEC9] rounded-xl p-2.5 xl:p-3 text-xs xl:text-sm focus:outline-none focus:ring-1 focus:ring-[#6B7C5E] resize-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs xl:text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="rounded text-[#8E3B24]"
                  />
                  <span>Tandai Menu Favorit</span>
                </label>
                <label className="flex items-center gap-2 text-xs xl:text-sm font-semibold cursor-pointer">
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
                  className="px-4 py-2 rounded-full border border-gray-300 text-xs xl:text-sm font-semibold hover:bg-gray-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#8E3B24] text-white text-xs xl:text-sm font-bold hover:bg-[#78301B] cursor-pointer"
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