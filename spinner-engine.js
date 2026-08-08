(() => {
  function ensureSpinnerState(){
    if(!room) return;
    if(!room.spinnerArms) room.spinnerArms={U:[],D:[]};
    if(!room.spinnerSides) room.spinnerSides={L:false,R:false};
    if(room.spinner===undefined) room.spinner=null;
  }

  function isSpinnerTile(tile){
    return !!(room?.spinner && tile && tile[0]===room.spinner.value && tile[1]===room.spinner.value);
  }

  function registerSpinner(tile,target='OPEN'){
    ensureSpinnerState();
    if(room.spinner || !tile || tile[0]!==tile[1]) return false;

    room.spinner={value:tile[0]};
    room.spinnerArms={U:[],D:[]};

    // If the first double is played onto an existing line, one of its two
    // straight-through sides is already covered by that connection.
    if(target==='L') room.spinnerSides={L:false,R:true};
    else if(target==='R') room.spinnerSides={L:true,R:false};
    else room.spinnerSides={L:false,R:false};

    room.log?.unshift(`${tile[0]}-${tile[1]} is the spinner.`);
    return true;
  }

  function mainEnds(){
    const c=room?.chain||[];
    if(!c.length) return {L:null,R:null};
    return {L:c[0][0],R:c[c.length-1][1]};
  }

  function armEnd(side){
    ensureSpinnerState();
    const arm=room?.spinnerArms?.[side]||[];
    if(!room?.spinner) return null;
    if(!arm.length) return room.spinner.value;
    return arm[arm.length-1][1];
  }

  function spinnerBranchUnlocked(){
    ensureSpinnerState();
    return !!(room?.spinner && room.spinnerSides?.L && room.spinnerSides?.R);
  }

  function legalTargetsForTile(tile){
    if(!room || !tile) return [];
    ensureSpinnerState();
    const c=room.chain||[];
    if(!c.length) return ['OPEN'];

    const out=[];
    const e=mainEnds();
    if(tile.includes(e.L)) out.push('L');
    if(tile.includes(e.R)) out.push('R');

    // The first double of the hand is the spinner, regardless of value:
    // 6-6, 5-5, 4-4, 3-3, 2-2, 1-1, or 0-0.
    // Its up/down arms unlock only after BOTH straight sides are covered.
    if(spinnerBranchUnlocked()){
      const u=armEnd('U'), d=armEnd('D');
      if(tile.includes(u)) out.push('U');
      if(tile.includes(d)) out.push('D');
    }
    return [...new Set(out)];
  }

  function orientTo(tile,match){
    if(tile[0]===match) return [tile[0],tile[1]];
    if(tile[1]===match) return [tile[1],tile[0]];
    return null;
  }

  function placeTileAtTarget(tile,target){
    if(!room || !tile) return false;
    ensureSpinnerState();

    if(target==='OPEN'){
      room.chain.push([tile[0],tile[1]]);
      registerSpinner(tile,'OPEN');
      return true;
    }

    if(target==='L'){
      const before=room.chain[0];
      const match=before[0];
      const q=orientTo(tile,match);
      if(!q) return false;

      // If the spinner itself is currently the left endpoint, this play covers
      // its left straight side. A double newly played here instead becomes the
      // spinner with its right straight side already covered.
      if(isSpinnerTile(before)) room.spinnerSides.L=true;
      room.chain.unshift([q[1],q[0]]);
      registerSpinner(tile,'L');
      return true;
    }

    if(target==='R'){
      const before=room.chain[room.chain.length-1];
      const match=before[1];
      const q=orientTo(tile,match);
      if(!q) return false;

      if(isSpinnerTile(before)) room.spinnerSides.R=true;
      room.chain.push(q);
      registerSpinner(tile,'R');
      return true;
    }

    if(target==='U' || target==='D'){
      if(!spinnerBranchUnlocked()) return false;
      const match=armEnd(target);
      const q=orientTo(tile,match);
      if(!q) return false;
      room.spinnerArms[target].push(q);
      return true;
    }
    return false;
  }

  function terminalContribution(tile,outerIndex){
    if(!tile) return 0;
    if(tile[0]===tile[1]) return tile[0]*2;
    return tile[outerIndex];
  }

  function spinnerExposedState(){
    ensureSpinnerState();
    const c=room?.chain||[];
    if(!c.length) return {parts:[],total:0};
    if(c.length===1 && !room?.spinnerArms?.U?.length && !room?.spinnerArms?.D?.length){
      return {parts:[c[0][0],c[0][1]],total:c[0][0]+c[0][1]};
    }
    const parts=[];
    parts.push(terminalContribution(c[0],0));
    parts.push(terminalContribution(c[c.length-1],1));
    ['U','D'].forEach(side=>{
      const arm=room?.spinnerArms?.[side]||[];
      if(arm.length) parts.push(terminalContribution(arm[arm.length-1],1));
    });
    return {parts,total:parts.reduce((a,b)=>a+b,0)};
  }

  window.ensureSpinnerState=ensureSpinnerState;
  window.registerSpinner=registerSpinner;
  window.spinnerBranchUnlocked=spinnerBranchUnlocked;
  window.legalTargetsForTile=legalTargetsForTile;
  window.placeTileAtTarget=placeTileAtTarget;
  window.spinnerExposedState=spinnerExposedState;
})();
