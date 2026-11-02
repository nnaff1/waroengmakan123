export interface BufferChannel {
  id: string;
  name: string;
  service: string; // 'instagram', 'tiktok', 'facebook', 'twitter', etc.
  avatar?: string;
}

export interface BufferAccountStatus {
  connected: boolean;
  email?: string;
  organization?: {
    id: string;
    name: string;
  };
  channels: BufferChannel[];
  hasInstagram: boolean;
  hasTikTok: boolean;
  instagramChannel?: BufferChannel;
  tiktokChannel?: BufferChannel;
  error?: string;
}

const BUFFER_GRAPHQL_ENDPOINT = 'https://api.buffer.com';

const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

export function getBufferApiKey(): string {
  return process.env.BUFFER_API_KEY || '';
}

/**
 * Fetch Buffer connection status, account email, organization, and connected social channels.
 */
export async function getBufferAccountStatus(): Promise<BufferAccountStatus> {
  const token = getBufferApiKey();
  if (!token) {
    return {
      connected: false,
      channels: [],
      hasInstagram: false,
      hasTikTok: false,
      error: 'API Key Buffer belum dikonfigurasi.',
    };
  }

  try {
    // 1. Fetch account and organizations
    const accountRes = await fetch(BUFFER_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetBufferAccount {
            account {
              id
              email
              organizations {
                id
                name
              }
            }
          }
        `,
      }),
      cache: 'no-store',
    });

    const accountData = await accountRes.json();
    if (accountData.errors && accountData.errors.length > 0) {
      return {
        connected: false,
        channels: [],
        hasInstagram: false,
        hasTikTok: false,
        error: accountData.errors[0]?.message || 'Gagal autentikasi Buffer API',
      };
    }

    const account = accountData.data?.account;
    const org = account?.organizations?.[0];
    const email = account?.email;

    if (!org?.id) {
      return {
        connected: true,
        email,
        channels: [],
        hasInstagram: false,
        hasTikTok: false,
      };
    }

    // 2. Fetch channels under this organization
    const channelsRes = await fetch(BUFFER_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetOrgChannels($input: ChannelsInput!) {
            channels(input: $input) {
              id
              name
              service
              avatar
            }
          }
        `,
        variables: {
          input: {
            organizationId: org.id,
          },
        },
      }),
      cache: 'no-store',
    });

    const channelsData = await channelsRes.json();
    const rawChannels: BufferChannel[] = channelsData.data?.channels || [];

    const channels: BufferChannel[] = rawChannels.map((c) => ({
      id: c.id,
      name: c.name,
      service: (c.service || '').toLowerCase(),
      avatar: c.avatar,
    }));

    const instagramChannel = channels.find((c) => c.service.includes('instagram'));
    const tiktokChannel = channels.find((c) => c.service.includes('tiktok'));

    return {
      connected: true,
      email,
      organization: {
        id: org.id,
        name: org.name,
      },
      channels,
      hasInstagram: Boolean(instagramChannel),
      hasTikTok: Boolean(tiktokChannel),
      instagramChannel,
      tiktokChannel,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      connected: false,
      channels: [],
      hasInstagram: false,
      hasTikTok: false,
      error: `Koneksi ke Buffer gagal: ${message}`,
    };
  }
}

export interface PublishOptions {
  platform: 'instagram' | 'tiktok';
  text: string;
  title?: string;
  target?: 'auto' | 'channel' | 'draft' | 'idea';
  channelId?: string;
  imageUrl?: string;
  mode?: 'shareNow' | 'customScheduled' | 'addToQueue';
  scheduledAt?: string; // ISO or datetime-local string
}

export interface PublishResult {
  success: boolean;
  type: 'post' | 'draft' | 'idea';
  id?: string;
  message: string;
  url?: string;
  channelName?: string;
  dueAt?: string | null;
}

/**
 * Publish or save promo post to Buffer.
 * Supports:
 * - Post Now (mode: 'shareNow')
 * - Custom Schedule (mode: 'customScheduled' with scheduledAt)
 * - Add to Queue (mode: 'addToQueue')
 */
export async function sendPromoToBuffer(options: PublishOptions): Promise<PublishResult> {
  const token = getBufferApiKey();
  const status = await getBufferAccountStatus();

  if (!status.connected || !status.organization?.id) {
    throw new Error('Buffer tidak terhubung atau organisasi tidak ditemukan.');
  }

  const orgId = status.organization.id;
  const isInstagram = options.platform === 'instagram';
  const targetChannel = isInstagram ? status.instagramChannel : status.tiktokChannel;
  const channelId = options.channelId || targetChannel?.id;
  const platformLabel = isInstagram ? 'Instagram' : 'TikTok';
  const title = options.title || `[Promo ${platformLabel}] WaroengMakan123`;

  // 1. If channel is connected (e.g. @waroengmakan123) and target is not forced to 'idea'
  if (channelId && options.target !== 'idea') {
    const isInstant = options.mode === 'shareNow';
    const isScheduled = Boolean(options.scheduledAt && !isInstant);

    let finalDueAt: string | null = null;
    let finalMode: 'shareNow' | 'customScheduled' | 'addToQueue' = 'addToQueue';

    if (isInstant) {
      finalMode = 'shareNow';
      finalDueAt = null;
    } else if (isScheduled && options.scheduledAt) {
      finalMode = 'customScheduled';
      try {
        finalDueAt = new Date(options.scheduledAt).toISOString();
      } catch {
        finalDueAt = null;
        finalMode = 'addToQueue';
      }
    } else {
      finalMode = 'addToQueue';
      finalDueAt = null;
    }

    const imageUrl = options.imageUrl || DEFAULT_FOOD_IMAGE;
    const assets = [
      {
        image: {
          url: imageUrl,
        },
      },
    ];

    const metadata = isInstagram
      ? {
          instagram: {
            type: 'post',
            shouldShareToFeed: true,
          },
        }
      : undefined;

    const postRes = await fetch(BUFFER_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation CreatePost($input: CreatePostInput!) {
            createPost(input: $input) {
              __typename
              ... on PostActionSuccess {
                post {
                  id
                  text
                  status
                  dueAt
                }
              }
              ... on InvalidInputError {
                message
              }
              ... on LimitReachedError {
                message
              }
              ... on NotFoundError {
                message
              }
              ... on UnauthorizedError {
                message
              }
              ... on UnexpectedError {
                message
              }
            }
          }
        `,
        variables: {
          input: {
            channelId,
            text: options.text,
            dueAt: finalDueAt,
            mode: finalMode,
            schedulingType: 'automatic',
            needsApproval: false,
            saveToDraft: false,
            assets,
            metadata,
          },
        },
      }),
    });

    const postData = await postRes.json();
    const result = postData.data?.createPost;

    if (result?.__typename === 'PostActionSuccess' && result.post) {
      const channelName = targetChannel?.name || 'Instagram';
      let msg = '';

      if (finalMode === 'shareNow') {
        msg = `Berhasil diposting langsung sekarang ke akun Instagram @${channelName}!`;
      } else if (finalMode === 'customScheduled' && finalDueAt) {
        const timeFormatted = new Date(finalDueAt).toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        msg = `Berhasil dijadwalkan untuk tayang pada ${timeFormatted} WIB di akun Instagram @${channelName}!`;
      } else {
        msg = `Berhasil dimasukkan ke antrean posting akun Instagram @${channelName}!`;
      }

      return {
        success: true,
        type: 'post',
        id: result.post.id,
        channelName,
        dueAt: result.post.dueAt,
        message: msg,
        url: `https://publish.buffer.com`,
      };
    }

    const errMsg = result?.message || postData.errors?.[0]?.message;
    if (errMsg) {
      console.warn('Direct posting error:', errMsg);
      throw new Error(errMsg);
    }
  }

  // 2. Fallback: Save as Idea in Buffer Idea board (safe, always succeeds)
  const ideaRes = await fetch(BUFFER_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
        mutation CreateIdea($input: CreateIdeaInput!) {
          createIdea(input: $input) {
            __typename
            ... on Idea {
              id
            }
            ... on IdeaResponse {
              idea {
                id
              }
            }
            ... on InvalidInputError {
              message
            }
          }
        }
      `,
      variables: {
        input: {
          organizationId: orgId,
          content: {
            text: `[${platformLabel.toUpperCase()} PROMO]\n${title}\n\n${options.text}`,
          },
        },
      },
    }),
  });

  const ideaData = await ideaRes.json();
  const ideaResult = ideaData.data?.createIdea;

  if (ideaResult?.__typename === 'Idea' || ideaResult?.__typename === 'IdeaResponse') {
    const ideaId = ideaResult.id || ideaResult.idea?.id;
    return {
      success: true,
      type: 'idea',
      id: ideaId,
      message: `Tersimpan ke Buffer Ideas untuk ${platformLabel}!`,
      url: `https://publish.buffer.com/ideas`,
    };
  }

  const fallbackErr = ideaResult?.message || ideaData.errors?.[0]?.message || 'Gagal menyimpan draf ke Buffer.';
  throw new Error(fallbackErr);
}
