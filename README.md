# CommitRank ⚡

> Modern GitHub leaderboard and developer analytics dashboard for classmates and peer networks, powered by real-time GitHub GraphQL data.

CommitRank automatically discovers developers from [@NeoXBikram's GitHub following list](https://github.com/NeoXBikram?tab=following), aggregates contribution calendars, repository impact, and recent developer velocity, and ranks peers transparently using a multi-metric scoring algorithm.

---

## 🚀 Key Features

- **🏆 Hall of Fame Podium:** Top 3 developer showcase highlighting champions with custom badges, scores, and contribution metrics.
- **📊 Comprehensive Leaderboard Table:**
  - Rank, Avatar, Developer profile links, and direct GitHub links.
  - Multi-metric columns: **Overall Score**, **365-Day Commits/Contributions**, **7-Day Velocity**, **Stars Received**, **Forks**, **Followers**, and **Public Repositories**.
  - Interactive Ascending/Descending sorting on all numeric columns.
  - Quick filters: *All Classmates*, *Active (7d)*, *Stars*, and *High Contributions*.
  - Live search across usernames, display names, and profile bios.
  - Rank change indicators (▲ climbed, ▼ dropped, • unchanged) based on historical snapshots.
  - Clean pagination for browsing classmate networks.
- **⚙️ Customizable Weight Adjuster:** Interactive modal allowing users to tweak weights for contributions, stars, forks, followers, and recent velocity—re-ranking the entire leaderboard in real time!
- **👤 Detailed Developer Profile Pages:** Dedicated `/users/[username]` route breaking down velocity across 7, 30, and 365 days alongside top public repositories and language distribution.
- **🛡️ Authentic Real Data:** Zero fake users or mocked statistics. Queries GitHub GraphQL API directly with built-in caching and rate limit resilience.
- **🌙 Modern Dark-First Design:** Styled with Tailwind CSS, refined typography, subtle glassmorphic gradients, accessible contrast, and smooth micro-interactions.

---

## 📐 Scoring Formula

The leaderboard calculates an overall developer score using configurable weights:

$$\text{Score} = (C \times W_c) + (S \times W_s) + (F \times W_f) + (Fl \times W_{fl}) + (V \times W_v) + (R \times W_r)$$

Where:
- $C$ = Total Public Contributions in last 365 days ($W_c = 1.0$)
- $S$ = Total Stars across owned public non-fork repos ($W_s = 2.5$)
- $F$ = Total Forks received across owned public repos ($W_f = 1.5$)
- $Fl$ = GitHub Followers count ($W_{fl} = 0.5$)
- $V$ = Recent Velocity: $(7\text{d} \times 2.0 + 30\text{d} \times 1.5)$ ($W_v = 1.2$)
- $R$ = Public Repositories count ($W_r = 0.2$)

All weights can be customized directly within the web app via the **Formula Weights** modal.

---

## ⚠️ GitHub API Limitations & Caveats

1. **Public Contributions vs Lifetime Commits:** GitHub does not provide an instant API metric for every commit made across an account's lifetime. The official reliable source is the `contributionsCollection.contributionCalendar` covering the past 365 days.
2. **Private Contributions:** Contributions made to private repositories are included only if the user has opted to "Include private contributions on my profile" in their GitHub profile settings.
3. **Repository Scope:** Stars and forks are counted for original, public repositories owned by the user (excluding third-party forks).
4. **Rate Limits:** GitHub GraphQL API grants 5,000 requests/hour for personal access tokens. Fetch calls are cached with Next.js to minimize API consumption.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, Cache Components)
- **Language:** TypeScript 5 (Strict mode)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React & Custom SVGs
- **Testing:** Vitest
- **Data Layer:** GitHub GraphQL API v4

---

## 📦 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/BikramGole/RepoPulse.git
cd RepoPulse
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory (based on `.env.example`):

```bash
cp .env.example .env.local
```

Edit `.env.local` to add your GitHub Personal Access Token:

```env
GITHUB_TOKEN=ghp_your_github_personal_access_token_here
```

> **Note:** A standard GitHub Personal Access Token (classic or fine-grained) with `read:user` and public repository read permissions is sufficient.

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run the Vitest test suite covering scoring formulas, sorting logic, and search filtering:

```bash
pnpm test
```

---

## 🚢 Deployment

CommitRank is ready for deployment on [Vercel](https://vercel.com):

1. Push your repository to GitHub.
2. Import the project in Vercel.
3. Add the `GITHUB_TOKEN` environment variable in the Vercel project settings.
4. Deploy!
