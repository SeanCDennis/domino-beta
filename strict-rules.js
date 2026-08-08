(() => {
  let strictSelected = null;

  function strictEnds() {
    const c = room?.chain || [];
    if (!c.length) return { left:0, right:0, total:0 };
    if (c.length === 1) {
      return { left:c[0][0], right:c[0][1], total:c[0][0] + c[0][1] };
    }
    const first = c[0], last = c[c.length - 1];
    const left = first[0] === first[1] ? first[0] * 2 : first[0];
    const right = last[0] === last[1] ? last[1] * 2 : last[1];
    return { left, right, total:left + right };
  }

  window.exposedEndState = strictEnds;
  window.money = function(){
    const total = strictEnds().total;
    if (total <= 0 || total % 5 !== 0) return 0;
    if (room?.rules?.points === 'no5' && total === 5) return 0;
    return total;
  };

  async function strictPlay(i, side) {
    const s = seat();
    if (!room || room.phase !== 'playing' || room.turn !== s) return;
    const t = room.hands?.[s]?.[i];
    if (!t || !can(t)) return;
    if (!room.chain.length && !(t[0] === 6 && t[1] === 6)) {
      room.log?.unshift('Big 6 must open the hand.');
      render();
      return;
    }

    const q = orient(t, side || 'R');
    room.hands[s].splice(i,1);
    (side === 'L' ? room.chain.unshift(q) : room.chain.push(q));
    room.requiredOpener = null;
    room.consecutivePasses = 0;
    room.log?.unshift(`${me().name} played ${t[0]}-${t[1]}.`);

    if (!room.hands[s].length) return resolveDomino(s);

    const exact = window.money();
    if (exact > 0) {
      room.pendingClaim = { seat:s, value:exact };
      await save();
      window.checkClaim();
      return;
    }

    room.pendingClaim = null;
    advance();
    await save();
    render();
    if (typeof window.driveBots === 'function') window.driveBots();
  }

  window.play = strictPlay;

  window.tap = function(i){
    if (!room || room.phase !== 'playing' || room.turn !== seat()) return;
    const t = room.hands?.[seat()]?.[i];
    if (!t || !can(t)) return;
    if (!room.chain.length && !(t[0] === 6 && t[1] === 6)) {
      room.log?.unshift('Big 6 must open the hand.');
      render();
      return;
    }
    const legal = sides(t);
    if (legal.length === 1) return strictPlay(i,legal[0]);
    strictSelected = i;
    sideModal.classList.add('show');
  };

  window.chooseSide = function(side){
    sideModal.classList.remove('show');
    if (strictSelected == null) return;
    const i = strictSelected;
    strictSelected = null;
    return strictPlay(i,side);
  };

  const originalCheckClaim = window.checkClaim;
  window.checkClaim = async function(){
    if (room?.pendingClaim) {
      const exact = window.money();
      if (exact <= 0) {
        room.pendingClaim = null;
        claimModal?.classList.remove('show');
        room.log?.unshift(`Open ends total ${strictEnds().total} — no money.`);
        advance();
        await save();
        render();
        if (typeof window.driveBots === 'function') window.driveBots();
        return;
      }
      room.pendingClaim.value = exact;
    }
    return originalCheckClaim?.();
  };

  async function autoBigSix(){
    if (!room || room.phase !== 'playing' || room.chain?.length) return;
    let holder=-1, idx=-1;
    for (let s=0; s<4; s++) {
      const i=(room.hands?.[s]||[]).findIndex(t=>t[0]===6 && t[1]===6);
      if (i>=0) { holder=s; idx=i; break; }
    }
    if (holder < 0) return;
    room.turn = holder;
    room.requiredOpener = [6,6];
    room.leaderReason = 'Big 6 starts';
    room.hands[holder].splice(idx,1);
    room.chain.push([6,6]);
    room.requiredOpener = null;
    room.pendingClaim = null;
    room.consecutivePasses = 0;
    room.log?.unshift(`${room.players[holder].name} automatically opens with Big 6.`);
    room.turn = (holder + 1) % 4;
    await save();
    render();
    if (typeof window.driveBots === 'function') window.driveBots();
  }

  window.autoBigSix = autoBigSix;

  const oldSolo = window.startSoloTest;
  if (oldSolo) window.startSoloTest = async function(...args){
    const out = await oldSolo(...args);
    await autoBigSix();
    return out;
  };

  const oldStart = window.startGame;
  if (oldStart) window.startGame = async function(...args){
    const out = await oldStart(...args);
    await autoBigSix();
    return out;
  };

  const oldNext = window.nextHand;
  if (oldNext) window.nextHand = async function(...args){
    const out = await oldNext(...args);
    await autoBigSix();
    return out;
  };
})();