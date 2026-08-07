(() => {
  const positions = {
    0: [],
    1: [5],
    2: [1,9],
    3: [1,5,9],
    4: [1,3,7,9],
    5: [1,3,5,7,9],
    6: [1,3,4,6,7,9]
  };
  const faceHTML = v => `<div class="face">${(positions[v]||[]).map(p=>`<i class="pip p${p}"></i>`).join('')}</div>`;
  window.dom = function(t,i,play){
    return `<div class="domino ${play?'playable':''}" ${play?`onclick="tap(${i})"`:''}>${faceHTML(t[0])}<div class="divider"></div>${faceHTML(t[1])}</div>`;
  };
  if (typeof window.render === 'function') {
    try { window.render(); } catch (_) {}
  }
})();