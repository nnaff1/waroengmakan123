-- Migration: Tambah kolom yang dibutuhkan sistem kasir ke tabel orders
-- Jalankan di Supabase Dashboard → SQL Editor

-- Kolom inti transaksi kasir
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_no      text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal        numeric(12, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax             numeric(12, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method  text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status          text DEFAULT 'Pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes           text;

-- Kolom untuk integrasi Midtrans
ALTER TABLE orders ADD COLUMN IF NOT EXISTS midtrans_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at            timestamptz;

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_orders_receipt_no ON orders(receipt_no);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
