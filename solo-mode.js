(() => {
  let botRunning=false;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const originalStartGame=window.startGame;
  const originalSave=window.save;
  const originalRenderLobby=window.renderLobby;
  const originalPlay=window.play;
  const originalClaim=window.claim;
  const originalPassTurn=window.passTurn;
  const originalNextHand=window.nextHand;

  function isBotTurn(){return !!(room&&room.phase==='playing'&&room.players?.[room.turn]?.bot);}

  function addSoloButton(){
    const rules=document.getElementById('hostRules');
    if(!rules||document.getElementById('soloTestBtn')) return;
    const btn=document.createElement('button');
    btn.id='soloTestBtn';btn.className='btn gold';btn.style.marginTop='8px';btn.textContent='Solo Test Mode';
    // Resolve at click time so later strict-rules wrappers are honored.
    btn.onclick=()=>window.startSoloTest();
    rules.appendChild(btn);
  }

  async function startSoloTest(){
    if(!host()) return;
    const coins=room.startingCoins||50;
    room.players=room.players.filter(p=>!p.bot);
    while(room.players.length<4){const i=room.players.length;room.players.push({token:`BOT-${i}`,name:`Test Player ${i+1}`,seat:i,wallet:coins,wrong:0,bot:true});}
    room.soloTest=true;room.consecutivePasses=0;room.spinner=null;room.spinnerArms={U:[],D:[]};room.spinnerSides={L:false,R:false};
    await originalStartGame();
    if(!window.__holdSoloBots) driveBots();
  }

  function legalBotMoves(){
    const handNow=room.hands?.[room.turn]||[];
    return handNow.map((tile,i)=>({tile,i,targets:typeof legalTargetsForTile==='function'?legalTargetsForTile(tile):[]})).filter(x=>x.targets.length);
  }

  async function botOneTurn(){
    if(!isBotTurn()) return;
    // Absolute first-hand invariant: nobody moves until 6-6 is physically on the table.
    if(room.handNo===1 && !(room.chain||[]).some(t=>t[0]===6&&t[1]===6)){
      if(typeof window.autoBigSix==='function') await window.autoBigSix();
      return;
    }
    const botSeat=room.turn,bot=room.players[botSeat];
    const options=legalBotMoves();
    if(!options.length){
      room.consecutivePasses=(room.consecutivePasses||0)+1;
      if(room.chain?.length&&room.consecutivePasses>=4){await locked();render();return;}
      room.turn=(room.turn+1)%4;await originalSave();render();return;
    }
    room.consecutivePasses=0;
    const move=options[Math.floor(Math.random()*options.length)];
    const target=move.targets[Math.floor(Math.random()*move.targets.length)];
    room.hands[botSeat].splice(move.i,1);
    if(!placeTileAtTarget(move.tile,target)){room.hands[botSeat].splice(move.i,0,move.tile);return;}
    room.requiredOpener=null;
    room.log.unshift(`${bot.name} played ${move.tile[0]}-${move.tile[1]}.`);

    if(room.hands[botSeat].length===0){await resolveDomino(botSeat);render();return;}
    const v=typeof money==='function'?money():0;
    if(v>0){
      if(!qual(botSeat)&&v<10){/* no score */}
      else{if(!qual(botSeat)&&v>=10)setQual(botSeat,true);setScore(botSeat,scoreOf(botSeat)+v);room.log.unshift(`${bot.name} counted ${v}.`);}
    }
    if(checkWinner()){await endGame();render();return;}
    room.turn=(room.turn+1)%4;await originalSave();render();
  }

  async function driveBots(){
    if(window.__holdSoloBots||botRunning) return;
    botRunning=true;
    try{
      let guard=0;
      while(room?.soloTest&&room.phase==='playing'&&isBotTurn()&&guard++<80){await sleep(500);await botOneTurn();}
    }catch(err){console.error(err);room?.log?.unshift(`Solo test error: ${err.message}`);render();}
    finally{botRunning=false;}
  }
  window.driveBots=driveBots;
  window.startSoloTest=startSoloTest;

  window.renderLobby=function(){originalRenderLobby();addSoloButton();const btn=document.getElementById('soloTestBtn');if(btn)btn.classList.toggle('hidden',!host());};
  window.play=async function(...args){const out=await originalPlay(...args);driveBots();return out;};
  window.claim=async function(...args){const out=await originalClaim(...args);driveBots();return out;};
  window.passTurn=async function(...args){const out=await originalPassTurn(...args);driveBots();return out;};
  window.nextHand=async function(...args){const out=await originalNextHand(...args);if(room){room.spinner=null;room.spinnerArms={U:[],D:[]};room.spinnerSides={L:false,R:false};}driveBots();return out;};
  addSoloButton();
})();