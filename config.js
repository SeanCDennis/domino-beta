window.DOMINO_CONFIG = {
  supabaseUrl: "https://wufrdygqkackqcgnxbvy.supabase.co",
  supabaseKey: "sb_publishable_ML6SfReLHaA2Amn6SCw0aw_GA8kCRuI"
};

window.addEventListener('DOMContentLoaded', async () => {
  const addCss = href => new Promise(resolve => {
    const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.onload=resolve;l.onerror=resolve;document.head.appendChild(l);
  });
  const addScript = src => new Promise((resolve,reject) => {
    const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=reject;document.body.appendChild(s);
  });

  await addCss('./domino-clarity.css?v=3');
  await addCss('./connected-table.css?v=2');

  // Order matters: each module wraps functions created by the previous one.
  await addScript('./domino-clarity.js?v=3');
  await addScript('./spinner-engine.js?v=2');
  await addScript('./solo-mode.js?v=6');
  await addScript('./scoring-engine.js?v=4');
  await addScript('./strict-rules.js?v=5');
  await addScript('./connected-table.js?v=3');
});
