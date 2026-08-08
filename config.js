window.DOMINO_CONFIG = {
  supabaseUrl: "https://wufrdygqkackqcgnxbvy.supabase.co",
  supabaseKey: "sb_publishable_ML6SfReLHaA2Amn6SCw0aw_GA8kCRuI"
};

window.addEventListener('DOMContentLoaded', () => {
  const clarityCss = document.createElement('link');
  clarityCss.rel = 'stylesheet';
  clarityCss.href = './domino-clarity.css?v=2';
  document.head.appendChild(clarityCss);

  const connectedCss = document.createElement('link');
  connectedCss.rel = 'stylesheet';
  connectedCss.href = './connected-table.css?v=1';
  document.head.appendChild(connectedCss);

  const clarity = document.createElement('script');
  clarity.src = './domino-clarity.js?v=2';
  document.body.appendChild(clarity);

  const solo = document.createElement('script');
  solo.src = './solo-mode.js?v=3';
  document.body.appendChild(solo);

  const connected = document.createElement('script');
  connected.src = './connected-table.js?v=1';
  document.body.appendChild(connected);

  const scoring = document.createElement('script');
  scoring.src = './scoring-engine.js?v=1';
  document.body.appendChild(scoring);
});
