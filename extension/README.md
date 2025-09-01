
# PhishGuard AI (Chrome Extension)
A real-time phishing detector that uses lightweight on-device AI and behavioral analysis to score risk and explain why.

## Features
- Monitors page behaviors: external/data URI scripts, hidden iframes, timers, disabled right-click, key listeners, cross-origin requests, insecure form posts, mixed content.
- On-device model: a fast logistic scorer with curated weights.
- Explainability: shows top contributing signals.
- Real-time: MutationObserver re-scores on DOM changes.
- In-page banner + popup UI.

## Install
1. Download the ZIP and extract.
2. Open `chrome://extensions`.
3. Enable Developer Mode.
4. Click "Load unpacked" and select the extracted `entension` folder.

## Build
No build step. MV3.

## Notes
- The model weights are heuristic for safety and speed, not trained on private data.
- All analysis is local; nothing is sent externally.

## License
MIT
