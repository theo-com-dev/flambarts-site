// Relais d'authentification GitHub pour le CMS (/admin) — étape 1 : redirection vers GitHub.
import { randomBytes } from 'node:crypto';

// Origine de confiance (fixe) — évite toute injection via l'en-tête Host.
// Quand un vrai domaine sera branché, définir SITE_URL dans les variables Vercel.
const SITE_URL = process.env.SITE_URL || 'https://flambarts.vercel.app';

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 500;
    res.end("GITHUB_CLIENT_ID manquant (à définir dans les variables d'environnement Vercel).");
    return;
  }

  const redirectUri = `${SITE_URL}/api/callback`;
  // Jeton anti-CSRF, aléatoire cryptographique, stocké en cookie httpOnly pour vérification au retour.
  const state = randomBytes(16).toString('hex');

  const authUrl =
    'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    '&scope=public_repo' +
    `&state=${state}`;

  res.setHeader(
    'Set-Cookie',
    `cms_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
  );
  res.writeHead(302, { Location: authUrl });
  res.end();
}
