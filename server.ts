import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db';
import { unifiedSearch } from './server/search';
import { generatePersonalizedFeed } from './server/recommendations';
import { fetchLrclibLyrics } from './server/providers/lrclib';
import { searchYouTubeLyricVideo } from './server/providers/youtube';
import { getEvaluatedProviders } from './server/providers/registry';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json({ limit: '10mb' }));

// Helper to authenticate user from Bearer token
function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: missing session token.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const user = db.getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: 'Session expired or invalid.' });
    return;
  }
  (req as any).user = user;
  (req as any).token = token;
  next();
}

function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = db.getUserByToken(token);
    if (user) {
      (req as any).user = user;
      (req as any).token = token;
    }
  }
  next();
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }
    const result = db.register(email, password, displayName || '');
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const result = db.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid credentials.' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: (req as any).user });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    db.logout(token);
  }
  res.json({ success: true });
});

app.delete('/api/auth/account', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    db.deleteAccount(userId);
    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PROFILE & AVATAR UPLOAD (BUG 2 FIX)
// ==========================================
app.patch('/api/user/profile', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { displayName, preferredLanguages, personalizationEnabled, includePreviews } = req.body;
    const updated = db.updateProfile(userId, {
      displayName,
      preferredLanguages,
      personalizationEnabled,
      includePreviews
    });
    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/user/avatar', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { avatarDataUrl } = req.body;

    if (!avatarDataUrl || typeof avatarDataUrl !== 'string') {
      res.status(400).json({ error: 'Valid image data is required.' });
      return;
    }

    // Validate mime type
    const matches = avatarDataUrl.match(/^data:(image\/(jpeg|png|webp|gif));base64,/i);
    if (!matches) {
      res.status(400).json({ error: 'Unsupported file type. Please upload a JPEG, PNG, or WebP photo.' });
      return;
    }

    // Validate size (max 5MB)
    const base64Length = avatarDataUrl.length - matches[0].length;
    const approxBytes = (base64Length * 3) / 4;
    if (approxBytes > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Image size exceeds maximum limit of 5MB.' });
      return;
    }

    const updated = db.updateAvatar(userId, avatarDataUrl);
    res.json({ user: updated, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/user/avatar', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const updated = db.removeAvatar(userId);
    res.json({ user: updated, success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// LIKED SONGS & PLAYLISTS
// ==========================================
app.get('/api/library/likes', authMiddleware, (req, res) => {
  const userId = (req as any).user.id;
  const likedSongs = db.getLikedSongs(userId);
  res.json({ likedSongs });
});

app.post('/api/library/likes/toggle', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { track } = req.body;
    if (!track || !track.id) {
      res.status(400).json({ error: 'Valid track is required.' });
      return;
    }
    const result = db.toggleLikeSong(userId, track);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/library/playlists', authMiddleware, (req, res) => {
  const userId = (req as any).user.id;
  const playlists = db.getPlaylists(userId);
  res.json({ playlists });
});

app.post('/api/library/playlists', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { title, description, coverUrl } = req.body;
    const newPlaylist = db.createPlaylist(userId, title, description, coverUrl);
    res.json({ playlist: newPlaylist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/library/playlists/:id', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const playlistId = req.params.id;
    const { title, description, coverUrl, tracks } = req.body;
    const updated = db.updatePlaylist(userId, playlistId, { title, description, coverUrl, tracks });
    res.json({ playlist: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/library/playlists/:id', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    db.deletePlaylist(userId, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/library/playlists/:id/tracks', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const playlistId = req.params.id;
    const { track } = req.body;
    const updated = db.addTrackToPlaylist(userId, playlistId, track);
    res.json({ playlist: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/library/playlists/:id/tracks/:trackId', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const playlistId = req.params.id;
    const trackId = req.params.trackId;
    const updated = db.removeTrackFromPlaylist(userId, playlistId, trackId);
    res.json({ playlist: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Followed Artists
app.get('/api/library/artists', authMiddleware, (req, res) => {
  const userId = (req as any).user.id;
  const artists = db.getFollowedArtists(userId);
  res.json({ artists });
});

app.post('/api/library/artists/toggle', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { artist } = req.body;
    const result = db.toggleFollowArtist(userId, artist);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SEARCH & LAST 15 SEARCHES HISTORY (FEATURE 2)
// ==========================================
app.get('/api/search', optionalAuthMiddleware, async (req, res) => {
  try {
    const query = String(req.query.q || '');
    const user = (req as any).user;
    const includePreviews = req.query.includePreviews === 'true' || user?.include_previews === true;

    const results = await unifiedSearch(query, includePreviews);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/search/history', authMiddleware, (req, res) => {
  const userId = (req as any).user.id;
  const history = db.getSearchHistory(userId);
  res.json({ history });
});

app.post('/api/search/history', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { query, searchType } = req.body;
    const updatedHistory = db.addSearchHistory(userId, query, searchType);
    res.json({ history: updatedHistory });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/search/history/:id', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    const updated = db.removeSearchHistoryItem(userId, req.params.id);
    res.json({ history: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/search/history', authMiddleware, (req, res) => {
  try {
    const userId = (req as any).user.id;
    db.clearSearchHistory(userId);
    res.json({ success: true, history: [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// RECOMMENDATIONS & FEED
// ==========================================
app.get('/api/recommendations/feed', optionalAuthMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const includePreviews = user?.include_previews === true;
    const feed = await generatePersonalizedFeed(user?.id, includePreviews);
    res.json(feed);
  } catch (err: any) {
    console.error('Recommendations feed error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/recommendations/listen', optionalAuthMiddleware, (req, res) => {
  const user = (req as any).user;
  if (user) {
    const { track, durationMs, completed } = req.body;
    if (track) {
      db.recordListening(user.id, track, durationMs, completed);
    }
  }
  res.json({ success: true });
});

app.post('/api/recommendations/hide', authMiddleware, (req, res) => {
  const userId = (req as any).user.id;
  const { trackId } = req.body;
  if (trackId) {
    db.hideTrack(userId, trackId);
  }
  res.json({ success: true });
});

app.post('/api/recommendations/reset', authMiddleware, (req, res) => {
  const userId = (req as any).user.id;
  db.resetPersonalization(userId);
  res.json({ success: true });
});

// ==========================================
// LYRICS & YOUTUBE FALLBACK SYSTEM
// ==========================================
app.get('/api/lyrics', async (req, res) => {
  try {
    const title = String(req.query.title || '');
    const artist = String(req.query.artist || '');
    const duration = Number(req.query.duration || 0);

    if (!title) {
      res.status(400).json({ error: 'Song title is required.' });
      return;
    }

    // Step 1: Check primary lyrics provider (LRCLIB)
    const lrclibLyrics = await fetchLrclibLyrics(title, artist, duration);
    if (lrclibLyrics && (lrclibLyrics.syncedLyrics || lrclibLyrics.plainLyrics)) {
      res.json({
        track_id: `${title}_${artist}`,
        title,
        artist,
        plain_lyrics: lrclibLyrics.plainLyrics,
        synced_lyrics: lrclibLyrics.syncedLyrics,
        source: 'lrclib'
      });
      return;
    }

    // Step 2: Fallback to YouTube lyrics video / official audio video
    const youtubeFallback = await searchYouTubeLyricVideo(title, artist);
    if (youtubeFallback) {
      res.json({
        track_id: `${title}_${artist}`,
        title,
        artist,
        source: 'youtube_video',
        youtube_fallback: {
          video_id: youtubeFallback.videoId,
          title: youtubeFallback.title,
          channel_title: youtubeFallback.channelTitle,
          thumbnail: youtubeFallback.thumbnail
        }
      });
      return;
    }

    // Step 3: Neither lyrics nor YouTube video accessible
    res.json({
      track_id: `${title}_${artist}`,
      title,
      artist,
      source: 'none'
    });
  } catch (err: any) {
    console.error('Lyrics endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 20 PROVIDERS STATUS DASHBOARD
// ==========================================
app.get('/api/providers/status', async (req, res) => {
  try {
    const providers = await getEvaluatedProviders();
    res.json({
      total: providers.length,
      evaluated_count: providers.length,
      providers
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// AUDIO DOWNLOAD PROXY
// ==========================================
app.get('/api/audio/download', async (req, res) => {
  try {
    const streamUrl = String(req.query.url || '');
    const title = String(req.query.title || 'Track');
    const artist = String(req.query.artist || 'Artist');
    if (!streamUrl) {
      res.status(400).send('Missing url parameter');
      return;
    }
    const cleanFilename = `${title} - ${artist}`.replace(/[/\\?%*:|"<>]/g, '_') + '.mp3';
    const upstreamRes = await fetch(streamUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!upstreamRes.ok) {
      res.status(upstreamRes.status).send('Failed to fetch audio stream');
      return;
    }
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(cleanFilename)}"`);
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'audio/mp4');
    if (upstreamRes.headers.get('content-length')) {
      res.setHeader('Content-Length', upstreamRes.headers.get('content-length')!);
    }
    const buffer = Buffer.from(await upstreamRes.arrayBuffer());
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

// ==========================================
// SERVER INITIALIZATION & VITE MIDDLEWARE
// ==========================================
async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Arait Music] Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
