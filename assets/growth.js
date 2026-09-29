/* Sharing is deliberately client-only: no accounts or invented leaderboard. */
'use strict';
const growthDialog = document.getElementById('shareDialog');
let sharedRun;
let incomingChallenge = parseChallenge(location.search);

function parseChallenge(search) {
  const params = new URLSearchParams(search);
  const score = params.get('score');
  const days = params.get('days');
  if (params.get('challenge') !== 'best-day' || !/^\d{1,9}(\.\d{1,2})?$/.test(score || '') || !/^\d{1,6}$/.test(days || '')) return null;
  if (Number(days) < 1 || Number(score) <= 0) return null;
  return { score: Number(score), days: Number(days) };
}

function renderGrowth() {
  const best = state.bestDayCommission;
  const target = [100, 500, 1000, 2500, 10000].find(n => n > best);
  document.getElementById('growthTitle').textContent = target ? `Your first ${currency(target)} commission day` : 'You built an affiliate machine.';
  document.getElementById('growthValue').textContent = `${currency(best)} best day · Day ${state.day}`;
  const progress = document.getElementById('growthProgress');
  progress.max = target || Math.max(best, 1);
  progress.value = best;
  document.getElementById('jumpToGame').textContent = state.campaigns.length ? 'Keep building →' : 'Build my first campaign →';
  document.getElementById('friendChallenge').hidden = !incomingChallenge;
  if (incomingChallenge) {
    const beaten = best > incomingChallenge.score;
    document.getElementById('friendTarget').textContent = `${beaten ? 'You beat the target!' : 'The target:'} ${currency(incomingChallenge.score)} in a single simulated day, reached by day ${incomingChallenge.days}. Your best: ${currency(best)}.`;
  }
}

function drawScorecard() {
  const canvas = document.getElementById('scoreCanvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#102d2b'; ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = '#17413d'; ctx.beginPath(); ctx.arc(1140, 80, 280, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4b964'; ctx.font = 'bold 26px sans-serif'; ctx.fillText('AFFILIATE HUB PRO  /  THE SIMULATOR', 64, 80);
  ctx.fillStyle = '#edf5ee'; ctx.font = '30px sans-serif'; ctx.fillText('MY BEST COMMISSION DAY', 64, 172);
  ctx.font = 'bold 94px sans-serif'; ctx.fillText(currency(sharedRun.score), 58, 283, 1080);
  ctx.fillStyle = '#a8cdc3'; ctx.font = '27px sans-serif'; ctx.fillText(`Day ${sharedRun.days}  ·  ${sharedRun.sales} total sales  ·  Level ${sharedRun.level}`, 64, 354);
  ctx.fillStyle = '#f4b964'; ctx.font = 'bold 46px sans-serif'; ctx.fillText('Think you can beat that?', 64, 461);
  ctx.fillStyle = '#edf5ee'; ctx.font = '25px sans-serif'; ctx.fillText('Play free at affiliatehub.pro', 64, 518);
  ctx.fillStyle = '#a8cdc3'; ctx.font = '20px sans-serif'; ctx.fillText('Simulated earnings. No real money. Self-reported score.', 64, 582);
  canvas.setAttribute('aria-label', `Best simulated commission day: ${currency(sharedRun.score)}. Day ${sharedRun.days}, ${sharedRun.sales} sales, level ${sharedRun.level}.`);
}

function openShare() {
  sharedRun = { score: Number(state.bestDayCommission.toFixed(2)), days: state.day, sales: state.totalSales, level: state.level };
  const url = new URL(location.pathname, location.origin);
  if (sharedRun.score > 0) {
    url.search = new URLSearchParams({ challenge: 'best-day', score: sharedRun.score, days: sharedRun.days });
  }
  document.getElementById('challengeLink').value = url.href;
  document.getElementById('shareStatus').textContent = sharedRun.score ? 'Send a challenge, or download a card to post with your link.' : 'Publish a campaign and end the day to earn your first score. You can invite a friend now.';
  drawScorecard();
  growthDialog.showModal();
}

async function copyChallenge() {
  const input = document.getElementById('challengeLink');
  try {
    await navigator.clipboard.writeText(input.value);
    document.getElementById('shareStatus').textContent = 'Link copied. Send it to a friend!';
  } catch (_) {
    input.focus(); input.select();
    document.getElementById('shareStatus').textContent = 'Select and copy the link above to share it.';
  }
}

document.getElementById('shareRun').addEventListener('click', openShare);
document.getElementById('summaryShareBtn').addEventListener('click', openShare);
document.getElementById('copyChallenge').addEventListener('click', copyChallenge);
document.getElementById('nativeShare').addEventListener('click', async () => {
  if (!navigator.share) return copyChallenge();
  try {
    await navigator.share({ title: 'Can you beat my affiliate strategy?', text: `My best day: ${currency(sharedRun.score)} in simulated commissions on Affiliate Hub Pro. Can you beat it? Free to play, no real money.`, url: document.getElementById('challengeLink').value });
    document.getElementById('shareStatus').textContent = 'Challenge shared!';
  } catch (error) {
    if (error.name !== 'AbortError') await copyChallenge();
  }
});
document.getElementById('downloadScore').addEventListener('click', () => {
  document.getElementById('scoreCanvas').toBlob(blob => {
    if (!blob) { document.getElementById('shareStatus').textContent = 'Could not create the card. Try copying your link instead.'; return; }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'affiliatehub-score.png';
    link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    document.getElementById('shareStatus').textContent = 'Card downloaded. Include your challenge link when you post it.';
  }, 'image/png');
});
document.getElementById('dismissChallenge').addEventListener('click', () => {
  incomingChallenge = null;
  const url = new URL(location.href);
  ['challenge', 'score', 'days'].forEach(key => url.searchParams.delete(key));
  history.replaceState(null, '', url); renderGrowth();
});
document.getElementById('jumpToGame').addEventListener('click', () => {
  hideOnboarding(); goToStep(1);
  const target = document.getElementById(innerWidth <= 859 ? 'mobileGameFlow' : 'publishBtn') || document.getElementById('publishBtn');
  target.setAttribute('tabindex', '-1');
  target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
  target.focus({ preventScroll: true });
});
window.growthReady = true;
renderGrowth();
