(() => {
  let botRunning = false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const originalStartGame = window.startGame;
  const originalSave = window.save;
  const originalRenderLobby = window.renderLobby;
  const originalPlay = window.play;
  const originalClaim = window.claim;
  const originalPassTurn = window.passTurn;
  const originalNextHand = window.nextHand;

  function isBotTurn() {
    return !!(room && room.phase === 'playing' && room.players?.[room.turn]?.bot);
  }

  function topDouble() {
    for (let v = 6; v >= 0; v--) {
      for (let s = 0; s < 4; s++) {
        if ((room.hands?.[s] || []).some(t => t[0] === v && t[1] === v)) return { seat: s, value: v };
      }
    }
    return { seat: 0, value: 0 };
  }

  async function enforceOpeningDouble(saveIt = true) {
    if (!room || room.phase !== 'playing' || room.chain?.length) return;
    const hd = topDouble();
    room.turn = hd.seat;
    room.requiredOpener = [hd.value, hd.value];
    room.leaderReason = `Big ${hd.value} starts`;
    room.log?.unshift(`${room.players[hd.seat].name} must open with ${hd.value}-${hd.value}.`);
    if (saveIt) await originalSave();
    if (typeof render === 'function') render();
  }

  function openerRequiredFor(tile) {
    if (!room?.requiredOpener || room.chain?.length) return false;
    return !(tile && tile[0] === room.requiredOpener[0] && tile[1] === room.requiredOpener[1]);
  }

  function addSoloButton() {
    const rules = document.getElementById('hostRules');
    if (!rules || document.getElementById('soloTestBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'soloTestBtn';
    btn.className = 'btn gold';
    btn.style.marginTop = '8px';
    btn.textContent = 'Solo Test Mode';
    btn.onclick = startSoloTest;
    rules.appendChild(btn);
    const note = document.createElement('div');
    note.className = 'tiny';
    note.style.marginTop = '6px';
    note.textContent = 'Fills open seats with test players so you can wash, deal, and play through the game alone.';
    rules.appendChild(note);
  }

  async function startSoloTest() {
    if (!host()) return;
    const coins = room.startingCoins || 50;
    room.players = room.players.filter(p => !p.bot);
    while (room.players.length < 4) {
      const i = room.players.length;
      room.players.push({ token:`BOT-${i}`, name:`Test Player ${i + 1}`, seat:i, wallet:coins, wrong:0, bot:true });
    }
    room.soloTest = true;
    room.log.unshift('Solo Test Mode: washing the bones and filling the table.');
    await originalStartGame();
    await enforceOpeningDouble();
    driveBots();
  }

  function legalBotMoves() {
    const handNow = room.hands?.[room.turn] || [];
    if (!room.chain?.length && room.requiredOpener) {
      const i = handNow.findIndex(t => t[0] === room.requiredOpener[0] && t[1] === room.requiredOpener[1]);
      return i >= 0 ? [{ tile: handNow[i], i, legalSides:['R'] }] : [];
    }
    return handNow.map((tile,i)=>({tile,i,legalSides:sides(tile)})).filter(x=>x.legalSides.length);
  }

  async function botOneTurn() {
    if (!isBotTurn()) return;
    const botSeat = room.turn;
    const bot = room.players[botSeat];
    const options = legalBotMoves();

    if (!options.length) {
      room.log.unshift(`${bot.name} passed.`);
      room.turn = (room.turn + 1) % 4;
      await originalSave();
      render();
      return;
    }

    const move = options[Math.floor(Math.random() * options.length)];
    const side = move.legalSides[Math.floor(Math.random() * move.legalSides.length)];
    const placed = orient(move.tile, side);
    room.hands[botSeat].splice(move.i, 1);
    side === 'L' ? room.chain.unshift(placed) : room.chain.push(placed);
    room.requiredOpener = null;
    room.log.unshift(`${bot.name} played ${move.tile[0]}-${move.tile[1]}.`);

    if (room.hands[botSeat].length === 0) {
      await resolveDomino(botSeat);
      render();
      return;
    }

    const v = value();
    if (v) {
      const fiveDisallowed = room.rules.points === 'no5' && v === 5;
      const belowGetIn = !qual(botSeat) && v < 10;
      if (fiveDisallowed || belowGetIn) {
        room.log.unshift(`${bot.name} has ${v}, but it does not count.`);
      } else {
        if (!qual(botSeat) && v >= 10) setQual(botSeat, true);
        setScore(botSeat, scoreOf(botSeat) + v);
        room.log.unshift(`${bot.name} counted ${v}.`);
      }
    }

    if (checkWinner()) {
      await endGame();
      render();
      return;
    }

    room.turn = (room.turn + 1) % 4;
    await originalSave();
    render();
  }

  async function driveBots() {
    if (botRunning) return;
    botRunning = true;
    try {
      let guard = 0;
      while (room?.soloTest && room.phase === 'playing' && isBotTurn() && guard++ < 30) {
        await sleep(450);
        await botOneTurn();
      }
    } finally {
      botRunning = false;
    }
  }

  window.startSoloTest = startSoloTest;

  window.startGame = async function (...args) {
    const out = await originalStartGame(...args);
    await enforceOpeningDouble();
    driveBots();
    return out;
  };

  window.renderLobby = function () {
    originalRenderLobby();
    addSoloButton();
    const btn = document.getElementById('soloTestBtn');
    if (btn) btn.classList.toggle('hidden', !host());
  };

  window.play = async function (i, s) {
    const mySeat = seat();
    const tile = room?.hands?.[mySeat]?.[i];
    if (room?.turn === mySeat && openerRequiredFor(tile)) {
      const req = room.requiredOpener;
      room.log.unshift(`Opening rule: ${req[0]}-${req[1]} must be played first.`);
      render();
      return;
    }
    const out = await originalPlay(i, s);
    if (room?.chain?.length) room.requiredOpener = null;
    driveBots();
    return out;
  };

  window.claim = async function (...args) { const out = await originalClaim(...args); driveBots(); return out; };
  window.passTurn = async function (...args) { const out = await originalPassTurn(...args); driveBots(); return out; };
  window.nextHand = async function (...args) {
    const out = await originalNextHand(...args);
    await enforceOpeningDouble();
    driveBots();
    return out;
  };

  addSoloButton();
})();