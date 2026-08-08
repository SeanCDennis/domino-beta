(() => {
  function exactMoney(){
    const state=typeof spinnerExposedState==='function'?spinnerExposedState():{total:0};
    const total=state.total||0;
    if(total<=0 || total%5!==0) return 0;
    if(room?.rules?.points==='no5' && total===5) return 0;
    return total;
  }
  window.money=exactMoney;
  window.exposedEndState=function(){ return typeof spinnerExposedState==='function'?spinnerExposedState():{parts:[],total:0}; };

  async function strictPlay(i,target){
    const s=seat();
    if(!room || room.phase!=='playing' || room.turn!==s) return;
    const t=room.hands?.[s]?.[i];
    if(!t) return;
    const legal=typeof legalTargetsForTile==='function'?legalTargetsForTile(t):[];
    if(!legal.includes(target)) return;
    if(!room.chain.length && !(t[0]===6 && t[1]===6)) return;

    room.hands[s].splice(i,1);
    if(!placeTileAtTarget(t,target)) { room.hands[s].splice(i,0,t); return; }
    room.requiredOpener=null;
    room.consecutivePasses=0;
    room.log?.unshift(`${me().name} played ${t[0]}-${t[1]}.`);

    if(!room.hands[s].length) return resolveDomino(s);

    const exact=exactMoney();
    if(exact>0){
      room.pendingClaim={seat:s,value:exact};
      await save();
      window.checkClaim();
      return;
    }

    room.pendingClaim=null;
    advance();
    await save();
    render();
    if(typeof window.driveBots==='function') window.driveBots();
  }
  window.play=strictPlay;

  const originalCheckClaim=window.checkClaim;
  window.checkClaim=async function(){
    if(room?.pendingClaim){
      const exact=exactMoney();
      if(exact<=0){
        room.pendingClaim=null;
        claimModal?.classList.remove('show');
        advance();
        await save();
        render();
        if(typeof window.driveBots==='function') window.driveBots();
        return;
      }
      room.pendingClaim.value=exact;
    }
    return originalCheckClaim?.();
  };

  async function autoBigSix(){
    if(!room || room.phase!=='playing' || room.chain?.length) return;
    let holder=-1,idx=-1;
    for(let s=0;s<4;s++){
      const i=(room.hands?.[s]||[]).findIndex(t=>t[0]===6&&t[1]===6);
      if(i>=0){holder=s;idx=i;break;}
    }
    if(holder<0) return;
    if(typeof ensureSpinnerState==='function') ensureSpinnerState();
    room.turn=holder;
    const tile=room.hands[holder][idx];
    room.hands[holder].splice(idx,1);
    placeTileAtTarget(tile,'OPEN');
    room.requiredOpener=null;
    room.pendingClaim=null;
    room.consecutivePasses=0;
    room.leaderReason='Big 6';
    room.log?.unshift(`${room.players[holder].name} opened 6-6.`);
    room.turn=(holder+1)%4;
    await save();
    render();
    if(typeof window.driveBots==='function') window.driveBots();
  }
  window.autoBigSix=autoBigSix;

  const oldSolo=window.startSoloTest;
  if(oldSolo) window.startSoloTest=async function(...args){const out=await oldSolo(...args);await autoBigSix();return out;};
  const oldStart=window.startGame;
  if(oldStart) window.startGame=async function(...args){const out=await oldStart(...args);await autoBigSix();return out;};
  const oldNext=window.nextHand;
  if(oldNext) window.nextHand=async function(...args){const out=await oldNext(...args);if(room){room.spinner=null;room.spinnerArms={U:[],D:[]};}await autoBigSix();return out;};
})();
