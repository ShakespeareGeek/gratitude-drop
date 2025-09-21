# Gratitude Drop

A minimal, anonymous daily gratitude sharing app.

## Setup

### Frontend (Next.js on Vercel)
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your worker URL
npm run dev
```

### Backend (Cloudflare Worker)
```bash
cd worker
npm install
# Edit wrangler.toml with your database/KV IDs
wrangler d1 create gratitude-drop-db
wrangler kv:namespace create CACHE
npm run db:init
npm run deploy
```

## Deployment

1. **Deploy Worker**: `cd worker && npm run deploy`
2. **Deploy Frontend**: Connect to Vercel, set `NEXT_PUBLIC_API_BASE` env var
3. **Admin Access**: `https://your-worker.workers.dev/admin?key=YOUR_SECRET`

## Architecture

- **Frontend**: Static Next.js on Vercel
- **Backend**: Cloudflare Worker + D1 + KV
- **No auth**: Cookie-based streaks only
- **Daily cycle**: New drops at 00:00 UTC, manual approval flow
# Production ready
# Force rebuild Thu Sep 11 09:22:04 EDT 2025
# Force rebuild Thu Sep 11 23:12:01 EDT 2025
# Force rebuild Fri Sep 12 08:20:36 EDT 2025
# Force rebuild Fri Sep 12 09:43:03 EDT 2025
# Force rebuild Sun Sep 21 14:27:19 EDT 2025
