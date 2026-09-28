// lib/midtrans.ts
// Midtrans client — hanya berjalan di server (Node.js/Route Handlers)

import MidtransClient from 'midtrans-client';

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';
const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '';

// Lazy singletons — tidak throw saat module load, error terdeteksi saat dipanggil
let _snap: InstanceType<typeof MidtransClient.Snap> | null = null;
let _core: InstanceType<typeof MidtransClient.CoreApi> | null = null;

export function getSnap() {
  if (!serverKey || serverKey.includes('XXXX')) {
    throw new Error(
      'MIDTRANS_SERVER_KEY belum diisi di .env.local. ' +
      'Ambil dari https://dashboard.sandbox.midtrans.com → Settings → Access Keys.'
    );
  }
  if (!_snap) {
    _snap = new MidtransClient.Snap({ isProduction, serverKey, clientKey });
  }
  return _snap;
}

export function getCoreApi() {
  if (!serverKey || serverKey.includes('XXXX')) {
    throw new Error('MIDTRANS_SERVER_KEY belum diisi di .env.local.');
  }
  if (!_core) {
    _core = new MidtransClient.CoreApi({ isProduction, serverKey, clientKey });
  }
  return _core;
}
