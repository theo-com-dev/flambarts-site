// Relais d'authentification GitHub pour le CMS (/admin), version Cloudflare Pages.
// Étape 1 : redirection vers GitHub avec un "state" anti-CSRF stocké en cookie.
export async function onRequestGet({ env }) {
  const siteUrl = env.SITE_URL || 'https://lesflambarts.fr';
  const clientId = env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response('GITHUB_CLIENT_ID manquant (variables du projet Cloudflare).', { status: 500 });
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const state = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

  const authUrl = 'https://github.com/login/oauth/authorize' +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(`${siteUrl}/api/callback`)}` +
    // "repo" : nécessaire car le dépôt sera privé une fois transféré au groupe.
    '&scope=repo' +
    `&state=${state}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      'Set-Cookie': `cms_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    },
  });
}
