# Affiliate Hub Pro

A static, browser-based affiliate marketing simulator. All money and commissions are simulated. Saves stay in localStorage on the player's device.

## Run

No build or backend is required. Serve this directory over HTTP:

```sh
python3 -m http.server 8080 --bind 0.0.0.0
```

Production uses HTTPS for service workers, clipboard access, and native sharing. The existing GitHub Pages/custom-domain setup can serve these files unchanged.

## Sharing and retention

- Next-milestone progress uses the player's best simulated commission day.
- Share from the home panel or day recap. Download a PNG scorecard, use native sharing, or copy a challenge link.
- Challenge links carry only the best-day score and current game day. They never import or overwrite a save. Inputs are validated and rendered as text.
- Scores are self-reported and random outcomes differ. This is friendly competition, not a verified leaderboard or a standardized challenge.
- Links use the current origin, so preview links stay in preview and production links use the production domain.
- Social crawlers receive the static PNG preview; individual scorecards are downloaded client-side, not dynamically rendered by a server.
- New runs require confirmation. Reduced-motion preferences are respected.

`assets/growth.js` and `assets/growth.css` contain the new sharing UI. The core game remains in `index.html`. The service worker uses network-first fetching with an offline fallback; bump its cache version when changing cached assets.

## Tests

```sh
npm ci
npx playwright install --with-deps chromium
npm test
```

An existing compatible Chromium installation can be used with `CHROMIUM_PATH=/path/to/chromium npm test`.

Tests cover the game loop, persistence, milestones, scorecard downloads, challenge validation, reset confirmation, clipboard fallback, mobile layout, app icons, and offline navigation. Native operating-system share sheets still need a real-device check.

## Growth follow-up

These features give players a reason to invite friends; they do not guarantee virality. Before adding accounts or competitive rankings, measure campaign-start, day-completion, share, and invited-player return rates with an appropriate consent setup. A verified leaderboard would require server-side validation and abuse protection.
