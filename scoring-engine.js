(() => {
  function exposedEndState() {
    const c = room?.chain || [];
    if (!c.length) return { left: 0, right: 0, total: 0, leftLabel: '—', rightLabel: '—' };

    const first = c[0];
    const last = c[c.length - 1];

    // With one bone, both exposed halves count. A double therefore counts twice.
    if (c.length === 1) {
      return {
        left: first[0],
        right: first[1],
        total: first[0] + first[1],
        leftLabel: String(first[0]),
        rightLabel: String(first[1]),
        single: true
      };
    }

    // Only the two OUTSIDE ends count. If an exposed end is a double,
    // both halves of that double contribute. Buried doubles contribute nothing.
    const leftContribution = first[0] === first[1] ? first[0] * 2 : first[0];
    const rightContribution = last[0] === last[1] ? last[1] * 2 : last[1];

    return {
      left: leftContribution,
      right: rightContribution,
      total: leftContribution + rightContribution,
      leftLabel: first[0] === first[1] ? `${first[0]}+${first[1]}` : String(first[0]),
      rightLabel: last[0] === last[1] ? `${last[0]}+${last[1]}` : String(last[1])
    };
  }

  window.exposedEndState = exposedEndState;

  // Board money is NEVER rounded. The raw exposed-end total must itself be a
  // valid five-count. With No 5s, 5 does not score; 10/15/20/25/... do.
  window.money = function () {
    const { total } = exposedEndState();
    if (total <= 0 || total % 5 !== 0) return 0;
    if (room?.rules?.points === 'no5' && total === 5) return 0;
    return total;
  };

  // The original alpha could create a claim from its older scoring logic.
  // Validate every pending claim against the ACTUAL current exposed ends before
  // showing Call Your Money. If the board is 12, 16, etc., no prompt is allowed.
  const originalCheckClaim = window.checkClaim;
  window.checkClaim = async function () {
    if (room?.pendingClaim) {
      const exact = window.money();
      if (exact <= 0) {
        room.log?.unshift(`Open ends total ${exposedEndState().total} — no money.`);
        room.pendingClaim = null;
        if (typeof advance === 'function') advance();
        if (typeof save === 'function') await save();
        if (typeof render === 'function') render();
        return;
      }
      // Never trust a stale/rounded pending value. Replace it with exact ends.
      room.pendingClaim.value = exact;
    }
    return originalCheckClaim?.();
  };

  const originalRenderGame = window.renderGame;
  window.renderGame = function () {
    originalRenderGame();

    const table = document.querySelector('.table');
    if (!table) return;

    let meter = document.getElementById('openEndsMeter');
    if (!meter) {
      meter = document.createElement('div');
      meter.id = 'openEndsMeter';
      meter.className = 'open-ends-meter';
      table.prepend(meter);
    }

    const state = exposedEndState();
    if (!room?.chain?.length) {
      meter.innerHTML = '<span>OPEN ENDS</span><b>Waiting for opener</b>';
      meter.classList.remove('money');
      return;
    }

    const breakdown = `${state.leftLabel} + ${state.rightLabel} = ${state.total}`;
    const count = window.money();
    const valid = count > 0;
    meter.innerHTML = `<span>OPEN ENDS</span><b>${breakdown}</b><em>${valid ? `MONEY ${count}` : 'NO MONEY'}</em>`;
    meter.classList.toggle('money', valid);
  };

  const style = document.createElement('style');
  style.textContent = `
    .open-ends-meter{position:relative;z-index:4;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:-2px auto 8px;padding:7px 10px;width:max-content;max-width:96%;border:1px solid #475569;border-radius:999px;background:#0b1220e8;color:#cbd5e1;font-size:12px;box-shadow:0 3px 10px #0005}
    .open-ends-meter span{font-size:10px;font-weight:900;letter-spacing:.08em;color:#94a3b8}
    .open-ends-meter b{font-size:14px;color:#f8fafc}
    .open-ends-meter em{font-style:normal;font-weight:950;color:#94a3b8}
    .open-ends-meter.money{border-color:#fbbf24;background:#2a210ce8}
    .open-ends-meter.money em{color:#fbbf24}
  `;
  document.head.appendChild(style);

  try { if (typeof render === 'function') render(); } catch (_) {}
})();
