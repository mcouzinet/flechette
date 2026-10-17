// Mesure d'audience Umami (index.html) : quelques événements de partie, sans nom de joueur.
// Rien ne part sans le script (site local, app native, bloqueur) : window.umami est alors absent.
export function track(event, data) {
  try { window.umami?.track(event, data) } catch { /* la mesure ne doit jamais gêner la partie */ }
}
