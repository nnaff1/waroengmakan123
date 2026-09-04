export type ComboItem = {
  id: string;
  name: string;
  category: string;
  tags: string;
  price: number;
  image: string;
  aiReason: string;
  mood: string[];
  rasa: string;
  vibe: string[];
};

export type MenuItem = {
  id: string;
  name: string;
  category: 'Makanan Utama' | 'Minuman' | 'Cemilan';
  price: number;
  description: string;
  image: string;
  isPopular?: boolean;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

export const ALL_MEAL_ITEMS: ComboItem[] = [
  {
    id: 'ai-1',
    name: 'Nasi Ayam Geprek Sambal Ijo + Es Teh',
    category: 'Paket Puas Hemat',
    tags: 'Spicy & Crispy',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Sengatan sambal ijo segar dipadu es teh dingin, mendongkrak fokus dan energi saat jam sibuk.',
    mood: ['Lapar Banget', 'Fokus'],
    rasa: 'Pedas Nampol',
    vibe: ['Makan Siang', 'Nongkrong'],
  },
  {
    id: 'ai-2',
    name: 'Ayam Balado + Tumis Kangkung + Mochi',
    category: 'Paket Kombo Sultan',
    tags: 'Spicy & Savory',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Lauk rempah pedas gurih Nusantara yang kaya nutrisi, dinetralkan mochi manis lumer.',
    mood: ['Lapar Banget', 'Self-Reward'],
    rasa: 'Pedas Nampol',
    vibe: ['Makan Siang', 'Cuaca Hujan'],
  },
  {
    id: 'ai-3',
    name: 'Nasi Rendang Sapi Premium + Perkedel',
    category: 'Paket Mantap Gurih',
    tags: 'Rich & Savory',
    price: 42000,
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Rendang rempah masak lambat 8 jam, memberikan rasa gurih mantap penenang pikiran.',
    mood: ['Lapar Banget', 'Santai'],
    rasa: 'Gurih Manis',
    vibe: ['Makan Siang', 'Nongkrong'],
  },
  {
    id: 'ai-4',
    name: 'Nasi Telur Dadar Bumbu Kecap + Kerupuk',
    category: 'Paket Hemat Manis',
    tags: 'Sweet & Umami',
    price: 22000,
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Menu comfort food rumahan hangat dengan aroma khas wajan yang ramah di kantong.',
    mood: ['Santai', 'Lapar Banget'],
    rasa: 'Gurih Manis',
    vibe: ['Makan Siang', 'Cuaca Hujan'],
  },
  {
    id: 'ai-5',
    name: 'Mie Goreng Rempah Pedas + Sate Taichan',
    category: 'Paket Hangat Mantap',
    tags: 'Hot & Tasty',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Bumbu rempah mie hangat menemani hawa dingin malam hari.',
    mood: ['Lapar Banget', 'Santai'],
    rasa: 'Pedas Nampol',
    vibe: ['Cuaca Hujan', 'Nongkrong'],
  },
  {
    id: 'ai-6',
    name: 'Pisang Goreng Keju Aren + Kopi Tubruk',
    category: 'Cemilan Santai',
    tags: 'Sweet & Cozy',
    price: 24000,
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Perpaduan renyah legit pisang keju dengan pahit kopi tubruk arabika yang menenangkan.',
    mood: ['Santai', 'Fokus'],
    rasa: 'Gurih Manis',
    vibe: ['Nongkrong', 'Cuaca Hujan'],
  },
  {
    id: 'ai-7',
    name: 'Martabak Manis Cokelat Keju + Es Kopi Susu',
    category: 'Paket Sweet Treats',
    tags: 'Sweet & Creamy',
    price: 38000,
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
    aiReason: 'Kombinasi klasik cokelat keju dengan kopi susu gula aren untuk mendongkrak mood.',
    mood: ['Santai', 'Self-Reward'],
    rasa: 'Gurih Manis',
    vibe: ['Nongkrong'],
  },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Nasi Rendang Sapi Premium',
    category: 'Makanan Utama',
    price: 32000,
    description: 'Daging sapi pilihan dimasak rempah Padang 8 jam hingga empuk meresap.',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
  },
  {
    id: 'm2',
    name: 'Ayam Balado Sambal Merah',
    category: 'Makanan Utama',
    price: 26000,
    description: 'Ayam goreng empuk dilumuri sambal balado cabai merah pedas gurih.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'm3',
    name: 'Nasi Ayam Geprek Sambal Ijo',
    category: 'Makanan Utama',
    price: 22000,
    description: 'Ayam krispi gurih dengan ulekan cabai rawit hijau segar dan jeruk limau.',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
  },
  {
    id: 'm4',
    name: 'Es Kopi Susu Gula Aren',
    category: 'Minuman',
    price: 18000,
    description: 'Espresso robusta-arabika berpadu susu segar dan sirup aren murni.',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
  },
  {
    id: 'm5',
    name: 'Es Jeruk Peras Murni',
    category: 'Minuman',
    price: 10000,
    description: 'Perasan jeruk peras asli alami penyegar dahaga tanpa pemanis buatan.',
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'm6',
    name: 'Pisang Goreng Keju Cokelat',
    category: 'Cemilan',
    price: 16000,
    description: 'Pisang raja crispy ditaburi keju cheddar melimpah dan meses cokelat.',
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'm7',
    name: 'Ceker Mercon Kuah Pedas',
    category: 'Cemilan',
    price: 15000,
    description: 'Ceker ayam presto lembut berselimut cabai rawit mercon ekstra pedas.',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
  },
];