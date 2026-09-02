// Relais d'authentification GitHub pour le CMS (/admin) — étape 2 : échange du code contre un jeton.
const SITE_URL = process.env.SITE_URL || 'https://flambarts.vercel.app';

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  const m = raw.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export default async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const code = req.query && req.query.code;
  const state = req.query && req.query.state;
  const savedState = getCookie(req, 'cms_oauth_state');

  const send = (status, content) => {
    const payload = JSON.stringify(content).replace(/</g, '\\u003c');
    const origin = JSON.stringify(SITE_URL);
    const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>
  (function () {
    var opener = window.opener;
    if (!opener) { document.body.innerHTML = '<p>Fenêtre ouverte directement — fermez-la.</p>'; return; }
    function receiveMessage(e) {
      // On ne renvoie le jeton qu'à notre propre site (jamais à une autre origine).
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
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    // On efface le cookie anti-CSRF (usage unique).
    res.setHeader('Set-Cookie', 'cms_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    res.statusCode = 200;
    res.end(html);
  };

  if (!clientId || !clientSecret) {
    return send('error', { error: 'Configuration manquante (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET).' });
  }
  // Vérification anti-CSRF : le state renvoyé par GitHub doit correspondre à celui du cookie.
  if (!state || !savedState || state !== savedState) {
    return send('error', { error: 'Session de connexion invalide. Merci de réessayer.' });
  }
  if (!code) {
    return send('error', { error: "Code d'autorisation manquant." });
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await tokenRes.json();
    if (data.access_token) {
      return send('success', { token: data.access_token, provider: 'github' });
    }
    return send('error', { error: data.error_description || "Échec de l'obtention du jeton." });
  } catch (err) {
    return send('error', { error: 'Erreur réseau : ' + err.message });
  }
}
