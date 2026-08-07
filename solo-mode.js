(() => {
  let botTimer = null;

  function isBotTurn() {
    return !!(room && room.phase === 'playing' && room.players?.[room.turn]?.bot);
  }

  function scheduleBots(delay = 350) {
    clearTimeout(botTimer);
    if (room?.soloTest && isBotTurn()) botTimer = setTimeout(botPlay, delay);
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
      room.players.push({
        token: `BOT-${i}`,
        name: `Test Player ${i + 1}`,
        seat: i,
        wallet: coins,
        wrong: 0,
        bot: true
      });
    }
    room.soloTest = true;
    room.log.unshift('Solo Test Mode: washing the bones and filling the table.');
    await originalStartGame();
    scheduleBots(500);
  }

  function chooseBotPlay() {
    const handNow = room.hands[room.turn] || [];
    const options = handNow
      .map((tile, i) => ({ tile, i, legalSides: sides(tile) }))
      .filter(x => x.legalSides.length);
    if (!options.length) return null;
    return options[Math.floor(Math.random() * options.length)];
  }

  async function botPlay() {
    if (!isBotTurn()) return;
    const botSeat = room.turn;
    const bot = room.players[botSeat];
    const move = chooseBotPlay();

    if (!move) {
      room.log.unshift(`${bot.name} passed.`);
      originalAdvance();
      await originalSave();
      render();
      return scheduleBots();
    }

    const side = move.legalSides[Math.floor(Math.random() * move.legalSides.length)];
    const placed = orient(move.tile, side);
    room.hands[botSeat].splice(move.i, 1);
    side === 'L' ? room.chain.unshift(placed) : room.chain.push(placed);
    room.log.unshift(`${bot.name} played ${move.tile[0]}-${move.tile[1]}.`);

    if (room.hands[botSeat].length === 0) {
      await resolveDomino(botSeat);
      render();
      return;
    }

    const v = value();
    if (v) {
      const fiveDisallowed = room.rules.points === 'nofives' && v === 5;
      const belowGetIn = !qual(botSeat) && v < room.rules.getin;
      if (fiveDisallowed || belowGetIn) {
        room.log.unshift(`${bot.name} has ${v}, but it does not count.`);
      } else {
        if (!qual(botSeat) && v >= room.rules.getin) setQual(botSeat, true);
        setScore(botSeat, scoreOf(botSeat) + v);
        room.log.unshift(`${bot.name} counted ${v}.`);
      }
    }

    if (checkWinner()) {
      await endGame();
      render();
      return;
    }

    originalAdvance();
    await originalSave();
    render();
    scheduleBots();
  }

  const originalStartGame = window.startGame;
  const originalAdvance = window.advance;
  const originalSave = window.save;
  const originalRenderLobby = window.renderLobby;
  const originalPlay = window.play;
  const originalClaim = window.claim;
  const originalPassTurn = window.passTurn;
  const originalNextHand = window.nextHand;

  window.startSoloTest = startSoloTest;

  window.renderLobby = function () {
    originalRenderLobby();
    addSoloButton();
    const btn = document.getElementById('soloTestBtn');
    if (btn) btn.classList.toggle('hidden', !host());
  };

  window.play = async function (...args) {
    await originalPlay(...args);
    scheduleBots();
  };

  window.claim = async function (...args) {
    await originalClaim(...args);
    scheduleBots();
  };

  window.passTurn = async function (...args) {
    await originalPassTurn(...args);
    scheduleBots();
  };

  window.nextHand = async function (...args) {
    await originalNextHand(...args);
    scheduleBots(500);
  };

  addSoloButton();
})();