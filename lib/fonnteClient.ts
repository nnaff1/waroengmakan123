export interface FonnteDeviceStatus {
  connected: boolean;
  device?: string;
  name?: string;
  quota?: string;
  expired?: string;
  statusString?: 'connect' | 'disconnect';
  error?: string;
}

export interface SendWhatsAppParams {
  target: string;
  message: string;
  url?: string;
  schedule?: number; // Unix timestamp in seconds
}

export function getFonnteToken(): string {
  return process.env.FONNTE_TOKEN || '';
}

/**
 * Fetch Fonnte device status and quota
 */
export async function getFonnteDeviceStatus(): Promise<FonnteDeviceStatus> {
  const token = getFonnteToken();
  if (!token) {
    return {
      connected: false,
      error: 'Token Fonnte belum dikonfigurasi di environment.',
    };
  }

  try {
    const res = await fetch('https://api.fonnte.com/device', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      cache: 'no-store',
    });

    const data = await res.json();
    if (data.status) {
      return {
        connected: data.device_status === 'connect',
        device: data.device,
        name: data.name,
        quota: String(data.quota),
        expired: data.expired,
        statusString: data.device_status,
      };
    } else {
      return {
        connected: false,
        error: data.reason || 'Gagal mengambil status perangkat Fonnte.',
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Network error';
    return {
      connected: false,
      error: msg,
    };
  }
}

/**
 * Send WhatsApp text/media message or broadcast via Fonnte
 */
export async function sendWhatsAppMessage({
  target,
  message,
  url,
  schedule,
}: SendWhatsAppParams) {
  const token = getFonnteToken();
  if (!token) {
    throw new Error('Token Fonnte tidak ditemukan di environment.');
  }

  const formData = new FormData();
  formData.append('target', target);
  formData.append('message', message);
  formData.append('countryCode', '62');

  if (url) {
    formData.append('url', url);
  }

  if (schedule) {
    formData.append('schedule', String(schedule));
  }

  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      Authorization: token,
    },
    body: formData,
  });

  const data = await res.json();

  if (!data.status) {
    throw new Error(data.reason || 'Gagal mengirim pesan via WhatsApp Fonnte.');
  }

  return data;
}
