// Relais d'authentification GitHub pour le CMS (/admin), version Cloudflare Pages.
// Étape 2 : vérification du state, échange du code contre un jeton, renvoi au CMS.
function getCookie(request, name) {
  const raw = request.headers.get('Cookie') || '';
  const m = raw.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function page(siteUrl, status, content) {
  const payload = JSON.stringify(content).replace(/</g, '\\u003c');
  const origin = JSON.stringify(siteUrl);
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>
  (function () {
    var opener = window.opener;
    if (!opener) { document.body.innerHTML = '<p>Fenêtre ouverte directement, vous pouvez la fermer.</p>'; return; }
    function receiveMessage(e) {
      // Le jeton n'est renvoyé qu'à notre propre site, jamais à une autre origine.
      if (e.origin !== ${origin}) return;
      opener.postMessage('authorization:github:${status}:' + ${JSON.stringify(payload)}, e.origin);
      window.removeEventListener('message', receiveMessage, false);
    }
    window.addEventListener('message', receiveMessage, false);
    opener.postMessage('authorizing:github', ${origin});
  })();
</script>
<p>Connexion en cours… vous pouvez fermer cette fenêtre.</p>
</body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      // Cookie anti-CSRF à usage unique : on l'efface.
      'Set-Cookie': 'cms_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    },
  });
}

export async function onRequestGet({ request, env }) {
  const siteUrl = env.SITE_URL || 'https://lesflambarts.fr';
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = getCookie(request, 'cms_oauth_state');

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return page(siteUrl, 'error', { error: 'Configuration manquante (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET).' });
  }
  if (!state || !savedState || state !== savedState) {
    return page(siteUrl, 'error', { error: 'Session de connexion invalide. Merci de réessayer.' });
  }
  if (!code) {
    return page(siteUrl, 'error', { error: "Code d'autorisation manquant." });
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'flambarts-cms' },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }),
    });
    const data = await tokenRes.json();
    if (data.access_token) {
      return page(siteUrl, 'success', { token: data.access_token, provider: 'github' });
    }
    return page(siteUrl, 'error', { error: data.error_description || "Échec de l'obtention du jeton." });
  } catch (err) {
    return page(siteUrl, 'error', { error: 'Erreur réseau : ' + err.message });
  }
}
