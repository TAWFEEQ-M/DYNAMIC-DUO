# MoneyWise AI

**Smart Personal Finance Manager** · CodeCanvas 2K26 · MONEYMATTERS — MAKE MONEY MAKE SENSE.

MoneyWise AI is a responsive, browser-only personal finance dashboard for understanding income, spending, budgets, savings goals, and day-to-day financial patterns. It is a static website and can be hosted directly with GitHub Pages.

## Team

- **Team name:** DYNAMIC-DUO
- **Team members:** [TEAM INPUT REQUIRED: add each member's name]

## Theme and Challenge

- **Theme:** MONEYMATTERS — MAKE MONEY MAKE SENSE.
- **Challenge:** Help people understand and manage their earnings, spending, savings, budgets, and financial decisions.

## Problem Statement

People often have transaction records but lack a simple, understandable view of where their money goes and how current spending relates to their plans. Many personal finance tools require account connections, paid services, or extensive setup. MoneyWise aims to make the first useful money check-in approachable, transparent, and private.

## Project Description

MoneyWise AI turns manually entered transactions into a monthly dashboard, expense analytics, category budgets, savings-goal progress, and practical rule-based observations. The app does not connect to banks and does not call an AI service. All records are stored in the current browser's local storage and are not synchronized between devices. A sample dataset makes the first visit demonstrable; users can edit it or restore the original demo explicitly.

The opening sign-in screen is a transparent demo gate, not real authentication. It accepts a valid email format to continue, requests no password, sends no request, and discards the email immediately. A tab-scoped session marker keeps the demo open across refresh in that tab; it is not an identity or security control. Sign out clears that marker and does not delete finance data.

This is a budgeting and educational prototype, not financial, tax, or investment advice. Cash flow calculated by the app is not a bank balance.

## Features

- Monthly income, expenses, cash flow, and savings-rate snapshot, recalculated from dated records.
- Transaction creation, editing, deletion, search, category/type filtering, sorting, validation, and CSV export.
- Six-month income-versus-expense charts and selected-month category breakdowns based on actual records.
- Monthly category budgets with actual spending, remaining amount, usage, and over-limit warnings.
- Savings goals with targets, deadlines, and separately recorded contributions. Contributions are not also recorded as expenses.
- Rule-based Money Coach observations grounded in the selected month's transactions, budgets, and goals. No AI API is connected.
- INR currency and Indian number formatting.
- First-launch sample data, visibly marked, with an explicit reset action. Existing saved data is not automatically replaced.
- Responsive desktop, tablet, and mobile navigation and layouts.
- Safe text rendering for user-entered descriptions and goal names.
- No bank passwords, card credentials, backend, paid API, package install, or build step.

## Technology Stack

- HTML5
- CSS3
- Vanilla JavaScript (ES2020+ browser APIs)
- Browser `localStorage`, Canvas 2D, native HTML dialogs, and Blob downloads
- Google Fonts (DM Sans and Manrope) when online; the application itself has no runtime API dependency

## Application Architecture

The application is deliberately small and static:

- `index.html` contains the root page, views, accessible forms, and dialogs.
- `styles.css` provides the responsive visual system and layouts.
- `app.js` owns data validation, sample data, local persistence, calculations, view rendering, Canvas charts, CSV export, and rule-based coaching.
- The sign-in screen is email-format validation plus a `sessionStorage` demo gate. It provides no account verification or access control. The login illustration is sample artwork, not account data.

The state is stored under the browser key `moneywise-ai-v1` as transactions, category budgets, savings goals and their contributions, and a sample-data flag. Stored records are normalized before use. If saved JSON is malformed, the app avoids replacing it automatically and starts a temporary empty session with a visible warning. Browser storage can be cleared by the user or browser, is local to one browser profile/device, and is not encrypted or synchronized. Do not enter sensitive credentials or treat this prototype as a secure financial record system.

Savings goal contributions live in each goal's contribution history and are excluded from transaction expense totals. Monthly summaries filter transactions by their `YYYY-MM` date; the transaction list and CSV export include all dates.

## Run Locally

No installation is required. Open `index.html` in a modern browser. For a local HTTP preview, run one of these from the repository root:

```powershell
py -m http.server 8000
```

Then visit `http://localhost:8000`. (Any equivalent static file server also works.)

## GitHub Pages Deployment

1. Commit and push the files to the existing repository's `main` branch.
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Set the branch to `main` and the folder to `/(root)`, then select **Save**.
5. Wait for the Pages deployment to finish. Verify the published URL shown in Settings → Pages. For this repository it is expected to be `https://tawfeeq-m.github.io/DYNAMIC-DUO/`; deployment has not been verified by this README.
6. Open the published URL and test a transaction, refresh to confirm local persistence, and check a mobile viewport. Data entered on the deployed origin is separate from local-file data and from other devices.

## AI Use and Team Record

### AI tools used

- GitHub Copilot in Visual Studio Code assisted with the application implementation and documentation in this repository.
- No generative AI service is called by the running website. “Money Coach” is deterministic, rule-based JavaScript.

### Important prompt used

- The project brief supplied for this repository asked for a complete MoneyWise AI hackathon website using root-level HTML, CSS, and vanilla JavaScript, with local-only data, transactions, analytics, budgets, goals, rule-based coaching, CSV export, responsive UI, testing, and GitHub Pages deployment. The full brief is in the project task/conversation; add any additional team prompts here if applicable: **[TEAM INPUT REQUIRED]**.

### AI-generated code modified

- The AI-assisted implementation was reviewed and edited during this work. In particular, first-launch demo persistence was changed to avoid accessing the shared state before initialization and to avoid overwriting malformed existing saved data automatically. Team members should add any further changes they make before submission: **[TEAM INPUT REQUIRED]**.

### Independently investigated team bug

- **[TEAM INPUT REQUIRED]** The team must independently reproduce and investigate at least one bug, record its symptoms, root cause, fix, and verification here, and identify who investigated it. Do not present the AI-assisted initialization correction above as an independent team investigation.

## Testing Record

- **Automated source check:** `node --check app.js` completed without syntax errors. VS Code diagnostics reported no errors in the generated HTML, CSS, or JavaScript.
- **Browser-driven checks:** The app was opened from the repository root in the integrated Chromium browser. Verified transaction creation, editing, and deletion by record ID; text, type, and category filtering; amount sorting; September monthly totals (₹68,000 income and ₹17,120 expenses); CSV Blob contents (header and edited transaction present); budget creation, editing, and deletion; ₹750 actual spending against ₹500/₹700 limits; the matching ₹50 Money Coach over-budget suggestion; goal creation, editing, deletion, contribution, and rejection of a contribution above the remaining target; and persistence after refresh. Verified goal contributions did not create transaction records. Verified explicit demo reset restored the 23-record dataset, malformed stored JSON was left unchanged with a visible storage warning, and user-entered HTML-like goal text created no HTML elements in Money Coach. Charts rendered at desktop dimensions, and document width did not exceed the 320px or 360px viewport.
- **Login browser checks:** Verified the initial signed-out screen, rejection of invalid email, acceptance of a valid email without storing it, tab-session persistence after refresh, sign-out returning to the login screen without deleting finance data, and no horizontal overflow at a 360px mobile viewport. Desktop split layout was inspected at 1365px. This gate is for the demo experience only and is not security authentication.
- **Manual checks still outstanding:** Repeat the full interaction flow in the browsers/devices used for judging, verify a user-initiated CSV download there, and inspect the deployed GitHub Pages URL after deployment. The local browser-driven checks are not a substitute for that review.
- **Team input:** Add any additional team-run manual tests and results here. Do not claim deployment succeeded until the public site has been opened and verified.

## Preparing the Existing Repository

From a clean checkout of this repository, review changes and prepare a commit without rewriting history:

```powershell
git status
git add README.md index.html styles.css app.js
git commit -m "Build MoneyWise AI finance dashboard"
git push origin main
```

If `git status` shows unrelated work, leave it untouched and stage only the four files above. GitHub authentication may prompt in your local Git client. After pushing, enable GitHub Pages using the steps above and verify the public URL in the Pages settings.
