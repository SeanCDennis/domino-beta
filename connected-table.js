(() => {
  const positions={0:[],1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
  const face=v=>`<div class="face">${(positions[v]||[]).map(p=>`<i class="pip p${p}"></i>`).join('')}</div>`;
  const bone=(t,classes='',target='')=>{
    const dbl=t[0]===t[1];
    return `<div class="boardbone ${dbl?'double':'horizontal'} ${classes}" ${target?`onclick="chooseBoardTarget('${target}')"`:''}>${face(t[0])}<div class="divider"></div>${face(t[1])}</div>`;
  };
  const branchBone=(t,classes='',target='')=>`<div class="boardbone vertical ${classes}" ${target?`onclick="chooseBoardTarget('${target}')"`:''}>${face(t[0])}<div class="divider"></div>${face(t[1])}</div>`;

  let selectedIndex=null;
  const originalRenderGame=window.renderGame;
  const originalPlay=window.play;

  function legal(){
    if(selectedIndex==null) return [];
    const t=room?.hands?.[seat()]?.[selectedIndex];
    return t&&typeof legalTargetsForTile==='function'?legalTargetsForTile(t):[];
  }

  function spinnerIndex(){
    if(!room?.spinner) return -1;
    return (room.chain||[]).findIndex(t=>t[0]===room.spinner.value&&t[1]===room.spinner.value);
  }

  function renderBranch(side,targets){
    const arm=room?.spinnerArms?.[side]||[];
    if(!arm.length) return '';
    return `<div class="spinner-branch ${side==='U'?'up':'down'}">${arm.map((t,i)=>branchBone(t,(i===arm.length-1&&targets.includes(side))?'play-here':'',i===arm.length-1&&targets.includes(side)?side:'')).join('')}</div>`;
  }

  function renderConnectedChain(){
    if(!window.chain||!room) return;
    if(!room.chain?.length){chain.innerHTML='<div class="tiny">Open table</div>';return;}
    const targets=legal(),si=spinnerIndex();
    chain.innerHTML=`<div class="connected-chain">${room.chain.map((t,i)=>{
      const isSpinner=i===si;
      const hit=[];
      if(i===0&&targets.includes('L')) hit.push('L');
      if(i===room.chain.length-1&&targets.includes('R')) hit.push('R');
      if(isSpinner&&targets.includes('U')&&!(room.spinnerArms?.U||[]).length) hit.push('U');
      if(isSpinner&&targets.includes('D')&&!(room.spinnerArms?.D||[]).length) hit.push('D');
      const target=hit[0]||'';
      const cls=`${isSpinner?'spinner':''} ${hit.length?'play-here':''}`;
      const core=bone(t,cls,target);
      if(!isSpinner) return core;
      return `<div class="spinner-node">${renderBranch('U',targets)}${core}${renderBranch('D',targets)}</div>`;
    }).join('')}</div>`;
    requestAnimationFrame(()=>{try{chain.scrollLeft=Math.max(0,(chain.scrollWidth-chain.clientWidth)/2);}catch(_){}});
  }

  function markSelected(){document.querySelectorAll('#hand .domino').forEach((el,i)=>el.classList.toggle('selected',i===selectedIndex));}

  window.renderGame=function(){originalRenderGame();renderConnectedChain();markSelected();};

  window.tap=function(i){
    if(!room||room.phase!=='playing'||room.turn!==seat()) return;
    const t=room.hands?.[seat()]?.[i];
    if(!t) return;
    const targets=typeof legalTargetsForTile==='function'?legalTargetsForTile(t):[];
    if(!targets.length) return;
    selectedIndex=i;render();
  };

  window.chooseBoardTarget=async function(target){
    if(selectedIndex==null) return;
    const t=room?.hands?.[seat()]?.[selectedIndex];
    let targets=t&&typeof legalTargetsForTile==='function'?legalTargetsForTile(t):[];
    if(!targets.includes(target)){
      if(target==='U'&&targets.includes('D')) target='D';
      else if(target==='D'&&targets.includes('U')) target='U';
      else return;
    }
    const i=selectedIndex;selectedIndex=null;
    await originalPlay(i,target);
  };

  const oldNext=window.nextHand;
  window.nextHand=async function(...args){selectedIndex=null;return oldNext(...args);};
  try{if(typeof render==='function')render();}catch(_){}
})();
