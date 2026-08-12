// Relais d'authentification GitHub pour le CMS (/admin) — étape 2 : échange du code contre un jeton.
export default async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const code = req.query && req.query.code;

  const send = (status, content) => {
    const payload = JSON.stringify(content).replace(/</g, '\\u003c');
    const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>
  (function () {
    function receiveMessage(e) {
      window.opener.postMessage(
        'authorization:github:${status}:' + ${JSON.stringify(payload)},
        e.origin
      );
      window.removeEventListener('message', receiveMessage, false);
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
<p>Connexion en cours… vous pouvez fermer cette fenêtre.</p>
</body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.statusCode = 200;
    res.end(html);
  };

  if (!clientId || !clientSecret) {
    return send('error', { error: "Configuration manquante (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET)." });
  }
  if (!code) {
    return send('error', { error: 'Code d\'autorisation manquant.' });
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
    return send('error', { error: data.error_description || 'Échec de l\'obtention du jeton.' });
  } catch (err) {
    return send('error', { error: 'Erreur réseau : ' + err.message });
  }
}
