const https = require('https');
const tokenCache = { token: null, expiresAt: 0 };
const artistCache = new Map();
const ARTIST_CACHE_TTL = 3600 * 1000;

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let raw = '';
      res.on('data', d => { raw += d; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getSpotifyToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  const id = process.env.SPOTIFY_CLIENT_ID || '';
  const secret = process.env.SPOTIFY_CLIENT_SECRET || '';
  if (!id || !secret) throw new Error('Spotify credentials not configured');
  const creds = Buffer.from(`${id}:${secret}`).toString('base64');
  const body = 'grant_type=client_credentials';
  const resp = await httpsRequest({ hostname:'accounts.spotify.com', path:'/api/token', method:'POST', headers:{ 'Authorization':`Basic ${creds}`, 'Content-Type':'application/x-www-form-urlencoded', 'Content-Length':Buffer.byteLength(body) } }, body);
  if (resp.status !== 200 || !resp.body.access_token) throw new Error(`Token error ${resp.status}`);
  tokenCache.token = resp.body.access_token;
  tokenCache.expiresAt = Date.now() + (resp.body.expires_in - 60) * 1000;
  return tokenCache.token;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const artistId = (req.query.id || '').trim();
  if (!artistId || !/^[A-Za-z0-9]{1,40}$/.test(artistId)) return res.status(400).json({ error: 'invalid_id' });
  const cached = artistCache.get(artistId);
  if (cached && Date.now() - cached.cachedAt < ARTIST_CACHE_TTL) { res.setHeader('Cache-Control','public,max-age=3600'); return res.status(200).json(cached.data); }
  const clientId = process.env.SPOTIFY_CLIENT_ID || '';
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
  if (!clientId || !clientSecret) return res.status(503).json({ error: 'spotify_not_configured' });
  try {
    const token = await getSpotifyToken();
    const resp = await httpsRequest({ hostname:'api.spotify.com', path:`/v1/artists/${artistId}`, method:'GET', headers:{ 'Authorization':`Bearer ${token}` } });
    if (resp.status !== 200) return res.status(502).json({ error: 'spotify_error', status: resp.status });
    const data = { id:resp.body.id, name:resp.body.name, images:resp.body.images??[], genres:resp.body.genres??[], followers:resp.body.followers?.total??0, popularity:resp.body.popularity, external_url:resp.body.external_urls?.spotify??'' };
    artistCache.set(artistId, { data, cachedAt: Date.now() });
    res.setHeader('Cache-Control','public,max-age=3600');
    return res.status(200).json(data);
  } catch(e) { return res.status(500).json({ error: e.message }); }
};
