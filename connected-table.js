(() => {
  const positions={0:[],1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
  const face=v=>`<div class="face">${(positions[v]||[]).map(p=>`<i class="pip p${p}"></i>`).join('')}</div>`;
  const bone=t=>{
    const dbl=t[0]===t[1];
    return `<div class="boardbone ${dbl?'double':'horizontal'}">${face(t[0])}<div class="divider"></div>${face(t[1])}</div>`;
  };

  let selectedIndex=null;
  const originalRenderGame=window.renderGame;
  const originalTap=window.tap;
  const originalPlay=window.play;

  function legalSidesForSelected(){
    if(selectedIndex==null||!room?.hands?.[seat()]?.[selectedIndex]) return [];
    const t=room.hands[seat()][selectedIndex];
    if(room?.requiredOpener && !room.chain?.length){
      if(t[0]!==room.requiredOpener[0]||t[1]!==room.requiredOpener[1]) return [];
    }
    return typeof sides==='function'?sides(t):[];
  }

  function renderConnectedChain(){
    if(!window.chain||!room) return;
    const legal=legalSidesForSelected();
    if(!room.chain?.length){
      chain.innerHTML='<div class="tiny">Open table</div>';
      return;
    }
    const leftVal=room.chain[0]?.[0];
    const rightVal=room.chain.at(-1)?.[1];
    chain.innerHTML=`<div class="connected-chain">
      <button class="endpoint left ${legal.includes('L')?'':'hidden'}" onclick="chooseConnectedSide('L')">${leftVal}</button>
      ${room.chain.map(bone).join('')}
      <button class="endpoint right ${legal.includes('R')?'':'hidden'}" onclick="chooseConnectedSide('R')">${rightVal}</button>
    </div>${selectedIndex!=null?'<div class="chainhint">Choose the glowing connection point</div>':''}`;
    requestAnimationFrame(()=>{ try{ chain.scrollLeft=Math.max(0,(chain.scrollWidth-chain.clientWidth)/2); }catch(_){} });
  }

  function markSelected(){
    document.querySelectorAll('#hand .domino').forEach((el,i)=>el.classList.toggle('selected',i===selectedIndex));
  }

  window.renderGame=function(){
    originalRenderGame();
    renderConnectedChain();
    markSelected();
  };

  window.tap=function(i){
    if(room?.turn!==seat()||room?.phase!=='playing') return;
    const t=room?.hands?.[seat()]?.[i];
    if(!t||!can(t)) return;
    if(room?.requiredOpener && !room.chain?.length && (t[0]!==room.requiredOpener[0]||t[1]!==room.requiredOpener[1])){
      room.log?.unshift(`Opening rule: ${room.requiredOpener[0]}-${room.requiredOpener[1]} must be played first.`);
      render();
      return;
    }
    selectedIndex=i;
    render();
  };

  window.chooseConnectedSide=async function(side){
    if(selectedIndex==null) return;
    const legal=legalSidesForSelected();
    if(!legal.includes(side)) return;
    const idx=selectedIndex;
    selectedIndex=null;
    await originalPlay(idx,side);
    if(typeof driveBots==='function') driveBots();
  };

  const oldChooseSide=window.chooseSide;
  window.chooseSide=function(side){
    if(selectedIndex!=null) return window.chooseConnectedSide(side);
    return oldChooseSide(side);
  };

  const oldNext=window.nextHand;
  window.nextHand=async function(...args){ selectedIndex=null; return oldNext(...args); };

  try{ if(typeof render==='function') render(); }catch(_){}
})();