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