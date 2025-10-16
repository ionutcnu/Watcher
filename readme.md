# Watcher — WoT Clan Activity Monitor

## Purpose
Daily monitoring of World of Tanks clan rosters to track and report player movements (joins/leaves).

## Core Functionality
- Fetches current roster for each monitored clan
- Compares with previous snapshot to detect changes
- Confirms departures using official player membership history (exact timestamps)
- Generates daily reports (CSV/Markdown) with optional notifications

## API Endpoints Used
- `GET /wot/clans/info` — current roster (members, joined_at)
- `GET /wot/clans/memberhistory` — player join/leave history
- `GET /wot/clans/list` — tag to clan_id resolution (optional)

## Configuration
**Required:**
- `application_id`, `realm` (e.g., `eu`), timezone
- List of `clan_id` or tags (resolved to IDs)

**Optional:**
- Notification channels (email/Discord/Telegram)
- Execution schedule

## Output
**Daily Report Contains:**
- Date, clan (tag/name), player (nickname, account_id)
- Event type (join/leave), timestamp (when available)
- Formats: CSV + Markdown
- Optional push notifications

## Technical Details
- **Schedule:** Once daily (e.g., 23:55)
- **API Usage:** Batched requests with backoff, respects rate limits
- **Storage:** Local snapshots (SQLite/JSON)
- **Privacy:** Public data only (clan_id, account_id, nickname)

## Application Type
- **Mobile/Standalone:** For local or cloud deployment without static IP
- **Server:** For VPS with fixed IP (configure authorized IPs)

## Quick Start
1. Configure clan list and realm
2. Run daily collection + diff
3. Review reports and alerts

## Short Descriptions
**One-liner:** "Daily WoT clan roster monitoring with join/leave detection and official history confirmation."

**Brief (≤160 chars):** "Track WoT clan member movements daily: detects joins/leaves with timestamps using current rosters and official history."