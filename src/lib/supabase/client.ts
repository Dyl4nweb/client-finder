import { createBrowserClient } from '@supabase/ssr';

export function cleanSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  if (url.endsWith('/rest/v1/')) {
    url = url.slice(0, -9);
  } else if (url.endsWith('/rest/v1')) {
    url = url.slice(0, -8);
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  return url;
}

export function isSupabaseConfigured(): boolean {
  const url = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    !url.includes('your-project-id') &&
    key.length > 20
  );
}

export function createClient() {
  const url = cleanSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}
