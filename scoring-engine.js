(() => {
  function state(){return typeof spinnerExposedState==='function'?spinnerExposedState():{parts:[],total:0};}
  window.exposedEndState=state;
  window.money=function(){const total=state().total||0;if(total<=0||total%5!==0)return 0;if(room?.rules?.points==='no5'&&total===5)return 0;return total;};

  const originalCheckClaim=window.checkClaim;
  window.checkClaim=async function(){
    if(room?.pendingClaim){
      const exact=window.money();
      if(exact<=0){room.pendingClaim=null;claimModal?.classList.remove('show');if(typeof advance==='function')advance();if(typeof save==='function')await save();if(typeof render==='function')render();return;}
      room.pendingClaim.value=exact;
    }
    return originalCheckClaim?.();
  };

  const originalRenderGame=window.renderGame;
  window.renderGame=function(){
    originalRenderGame();
    const table=document.querySelector('.table');if(!table)return;
    let meter=document.getElementById('openEndsMeter');
    if(!meter){meter=document.createElement('div');meter.id='openEndsMeter';meter.className='open-ends-meter';table.prepend(meter);}
    const s=state(),count=window.money();
    meter.innerHTML=!room?.chain?.length?'<b>—</b>':`<b>${s.parts.join(' + ')} = ${s.total}</b><em>${count?count:''}</em>`;
    meter.classList.toggle('money',count>0);
  };

  const style=document.createElement('style');
  style.textContent='.open-ends-meter{position:relative;z-index:4;display:flex;justify-content:center;gap:8px;margin:-2px auto 8px;padding:5px 9px;width:max-content;max-width:96%;border-radius:999px;background:#0b1220cc;color:#cbd5e1;font-size:12px}.open-ends-meter b{color:#f8fafc}.open-ends-meter em{font-style:normal;font-weight:950;color:#39ff14}.open-ends-meter.money{box-shadow:0 0 14px #39ff1455}';
  document.head.appendChild(style);
})();
