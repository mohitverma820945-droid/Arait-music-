// Central artwork resolver
export function getBestArtworkUrl(artwork_url: string | undefined | null, title: string, artist: string, album?: string): string {
  // 1. Valid artwork check
  if (artwork_url && artwork_url.trim() !== '' && !artwork_url.includes('default') && !artwork_url.includes('undefined')) {
    return artwork_url.replace('http://', 'https://').replace('150x150', '500x500');
  }

  // 2. Fallback: Neutral musical icon
  return 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#525252" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>');
}
