<div align="center">

# 🎮 WoT Clan Watcher

**Real-time World of Tanks clan monitoring and player tracking system**

[![Live Demo](https://img.shields.io/badge/Live-clanspy.win-blue?style=for-the-badge)](https://clanspy.win)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

Track clan member movements, monitor player statistics, and receive real-time notifications when players join or leave clans.

[Live Demo](https://clanspy.win) · [Report Bug](https://github.com/yourusername/watcher/issues) · [Request Feature](https://github.com/yourusername/watcher/issues)

</div>

---

## ✨ Features

### 🔍 Real-Time Monitoring
- **Automated Clan Scanning** - Continuous monitoring of World of Tanks clan rosters
- **Change Detection** - Instantly detects when players join or leave monitored clans
- **Historical Tracking** - Complete history of player movements with timestamps
- **Bulk Import** - Import multiple clans at once via CSV or manual entry

### 📊 Advanced Analytics
- **Player Statistics** - Integrated with Tomato.gg for WN8, win rate, and battle stats
- **Recent Performance** - View 60-day player statistics on-demand
- **Clan History** - Full newsfeed of clan events including role changes
- **Search & Filter** - Find clans quickly with autocomplete search

### 🔔 Notifications
- **Discord Integration** - Real-time webhooks for player departures
- **Customizable Alerts** - Configure which events trigger notifications
- **Beautiful Embeds** - Rich Discord embeds with player stats and clan info

### 🎨 Modern UI
- **Tactical Military Theme** - Immersive World of Tanks-inspired design
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Interactive Components** - Smooth animations and transitions
- **Real-time Updates** - Live data refresh without page reload

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **[Next.js](https://nextjs.org/)** | React framework with SSR & API routes | 15.5.5 |
| **[React](https://react.dev/)** | UI component library | 19.1.0 |
| **[TypeScript](https://www.typescriptlang.org/)** | Type-safe JavaScript | 5.x |
| **[Tailwind CSS](https://tailwindcss.com/)** | Utility-first CSS framework | 4.x |
| **[Framer Motion](https://www.framer.com/motion/)** | Animation library | 12.x |
| **[GSAP](https://greensock.com/gsap/)** | High-performance animations | 3.x |
| **[Lucide React](https://lucide.dev/)** | Modern icon library | Latest |

### Backend & Infrastructure
| Technology | Purpose | Version |
|------------|---------|---------|
| **[Cloudflare Workers](https://workers.cloudflare.com/)** | Serverless edge computing | Latest |
| **[Cloudflare D1](https://developers.cloudflare.com/d1/)** | Serverless SQLite database | Latest |
| **[OpenNext](https://opennext.js.org/)** | Next.js adapter for Cloudflare | 1.11.0 |
| **[Wrangler](https://developers.cloudflare.com/workers/wrangler/)** | Cloudflare CLI tool | 4.43.0 |

### APIs & Integrations
| Service | Purpose | Documentation |
|---------|---------|---------------|
| **Wargaming API** | World of Tanks data (clans, players) | [API Docs](https://developers.wargaming.net/) |
| **Tomato.gg API** | Advanced player statistics (WN8, recent stats) | [API Docs](https://tomato.gg/api) |
| **Discord Webhooks** | Real-time notifications | [Webhook Guide](https://discord.com/developers/docs/resources/webhook) |

### Database Schema
**5 Tables in Cloudflare D1:**
- `snapshots` - Clan roster snapshots with timestamps
- `changes` - Player join/leave events tracking
- `monitored_clans` - Active clan monitoring configuration
- `monitoring_config` - Global notification settings
- `exclusion_alerts` - Player departure alert history

---

## 🚀 Getting Started

### Prerequisites
```bash
# Node.js 18+ and npm
node --version  # v18.x or higher
npm --version   # 9.x or higher

# Cloudflare account (free tier works)
# Wargaming API key (free from developers.wargaming.net)
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/watcher.git
cd watcher
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create .env.local file
WARGAMING_APPLICATION_ID=your_api_key_here
WARGAMING_REALM=eu
WARGAMING_API_BASE_URL=https://api.worldoftanks.eu
NEXT_PUBLIC_APP_NAME="WoT Clan Watcher"
```

4. **Initialize Cloudflare D1 database**
```bash
# Create D1 database
npx wrangler d1 create wot-watcher-db

# Update wrangler.toml with your database_id
# Then apply schema
npx wrangler d1 execute wot-watcher-db --remote --file=schema.sql
```

5. **Configure Cloudflare secrets**
```bash
npx wrangler secret put WARGAMING_APPLICATION_ID
# Paste your API key when prompted
```

### Development

```bash
# Run development server
npm run dev

# Build for production
npm run build:worker

# Deploy to Cloudflare
npm run deploy

# View live logs
npx wrangler tail
```

---

## 📖 Usage

### Adding Clans to Monitor

1. Navigate to the **Monitoring** page
2. Click **Bulk Import** or add clans individually
3. Enter clan tags (e.g., `FAM`, `FAME`, `FAM-1`)
4. Click **Import** - clans will be added to monitoring list

### Viewing Changes

- **Home Page** - View recent player movements across all monitored clans
- **Filter by Date** - Select date range to view historical changes
- **Search** - Find specific clans or players
- **Export** - Download changes as CSV/Excel for analysis

### Manual Scan

1. Go to **Monitoring** page
2. Click **Manual Check**
3. Watch real-time progress as each clan is scanned
4. View leavers with on-demand statistics

### Discord Notifications

1. Create a Discord webhook in your server settings
2. Navigate to **Monitoring Config**
3. Paste webhook URL and configure notification types
4. Save - alerts will be sent automatically

---

## 🏗️ Architecture

### System Design
```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│   Browser   │ ───> │ Cloudflare Edge  │ ───> │ Wargaming   │
│   (React)   │      │   (Next.js API)  │      │     API     │
└─────────────┘      └──────────────────┘      └─────────────┘
                              │
                              ├──> Cloudflare D1 Database
                              │
                              └──> Discord Webhooks
```

### Key Components

**Frontend Routes:**
- `/` - Main dashboard with change history
- `/monitoring` - Clan management and manual scanning
- `/api/*` - REST API endpoints

**API Routes:**
- `/api/scan-clan` - Scan single clan for changes
- `/api/changes` - Get recent player movements
- `/api/monitored-clans` - CRUD for monitored clans
- `/api/bulk-import` - Import multiple clans
- `/api/clan-history` - Get clan newsfeed
- `/api/player-stats` - Fetch player statistics
- `/api/discord-notify` - Send Discord notifications

### Database Operations
All database operations use prepared statements with proper SQL injection protection:
```typescript
// Example: Get recent changes
const changes = await db.prepare(`
  SELECT * FROM changes
  WHERE timestamp >= ?
  ORDER BY timestamp DESC
`).bind(cutoffTimestamp).all();
```

---

## 🔧 Configuration

### Wrangler Configuration (`wrangler.toml`)
```toml
name = "wot-clan-watcher"
compatibility_date = "2025-01-16"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "wot-watcher-db"
database_id = "your-database-id"

[vars]
WARGAMING_REALM = "eu"
WARGAMING_API_BASE_URL = "https://api.worldoftanks.eu"
```

### Custom Domain Setup
1. Add domain to Cloudflare DNS
2. Update `wrangler.toml`:
```toml
[[routes]]
pattern = "clanspy.win"
custom_domain = true
```

---

## 📊 Performance

- **⚡ Edge Computing** - Sub-50ms response times via Cloudflare's global network
- **🌐 Global CDN** - Static assets served from 300+ data centers
- **💾 D1 Database** - SQLite at the edge with automatic replication
- **🔄 Efficient Caching** - Smart caching for repeated API calls
- **📦 Small Bundle** - Optimized production build < 7MB

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Wargaming.net** - For providing the World of Tanks API
- **Tomato.gg** - For advanced player statistics
- **Cloudflare** - For edge computing and D1 database
- **OpenNext** - For making Next.js work on Cloudflare Workers

---

## 📧 Contact

**Project Link:** [https://github.com/yourusername/watcher](https://github.com/yourusername/watcher)

**Live Demo:** [https://clanspy.win](https://clanspy.win)

---

<div align="center">

Made with ❤️ for the World of Tanks community

**[⬆ back to top](#-wot-clan-watcher)**

</div>
