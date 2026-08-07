window.DOMINO_CONFIG = {
  supabaseUrl: "https://wufrdygqkackqcgnxbvy.supabase.co",
  supabaseKey: "sb_publishable_ML6SfReLHaA2Amn6SCw0aw_GA8kCRuI"
};

window.addEventListener('DOMContentLoaded', () => {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = './domino-clarity.css?v=1';
  document.head.appendChild(css);

  const clarity = document.createElement('script');
  clarity.src = './domino-clarity.js?v=1';
  document.body.appendChild(clarity);

  const solo = document.createElement('script');
  solo.src = './solo-mode.js?v=2';
  document.body.appendChild(solo);
});
