// Relais d'authentification GitHub pour le CMS (/admin) — étape 1 : redirection vers GitHub.
export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 500;
    res.end('GITHUB_CLIENT_ID manquant (à définir dans les variables d\'environnement Vercel).');
    return;
  }
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = `${proto}://${host}/api/callback`;
  const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  const authUrl =
    'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    '&scope=repo' +
    `&state=${state}`;

  res.writeHead(302, { Location: authUrl });
  res.end();
}
