# Vitallity

An ultra-modern intelligent wellness platform. Luxury health meets editorial minimalism.

## Stack

- **Frontend**: React + Tailwind CSS + shadcn/ui
- **Backend**: Express + SQLite (better-sqlite3) + Drizzle ORM
- **AI**: Anthropic Claude (chat, insights, weekly reviews)
- **Typography**: Playfair Display + Outfit

## Features

- **Onboarding**: 9-step personalized health profile
- **Daily Check-ins**: 5-phase flow (vitals, food logging, exercise, water, AI insights)
- **AI Chat**: Context-aware wellness coach (Claude Haiku/Sonnet/Opus)
- **Milestones**: Goal tracking with weekly steps, goalpost adjustment, completion celebrations
- **Calibration Engine**: 14-day rolling metrics with Dunning-Kruger gap detection
- **Profile Management**: Editable conditions, medications, goals with BMI recalculation
- **Data Export**: Full JSON export and account deletion

## Getting Started

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm run start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` or `production` |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for AI features |

## Deploy on Railway

1. Connect this repo on [Railway](https://railway.com)
2. Add `ANTHROPIC_API_KEY` in the Variables tab
3. Deploy — Railway auto-detects the build and start commands

## License

Private
