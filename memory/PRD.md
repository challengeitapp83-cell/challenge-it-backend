# Challenge It - Product Requirements Document

## Overview
**Challenge It** is a premium gamified social challenge mobile application where users can create, join and compete in challenges across various categories (Sport, Santé, Habitudes, Business). Users publish daily proofs of their progress and earn points, levels, streaks, badges, and reputation.

## Tech Stack
- **Frontend**: Expo SDK 54 + React Native + Expo Router
- **Backend**: FastAPI + Python
- **Database**: MongoDB
- **Auth**: Google OAuth via Emergent Auth

## Design System
- Background: #0F0F0F (deep black)
- Cards: #1E1E1E (dark grey)
- Primary: #007AFF (electric blue)
- Secondary: #9D4CDD (purple)
- Success: #32D74B (green for progress)
- Warning: #FFD700 (gold for badges)
- Dark mode only, premium feel

## Screens
1. **Login** - Google OAuth with brand identity, addictive messaging
2. **Home** (KEY SCREEN) - Money banner, social pressure feed, active challenges, ranking widget, triggers, trending with pots, badges with XP bonuses
3. **Challenges** - List with category filters, money highlights, pot emphasis
4. **Challenge Detail** - Info, stats, leaderboard, pot section, **"Miser" button** linking to betting flow, join/publish CTA
5. **Betting Flow** - 4-step betting process (Amount > Security > Payment > Confirmation)
6. **Publish Proof** - Challenge selector, image upload, text
7. **Leaderboard** - Global rankings with top 3 podium, friends mode
8. **Profile** - Stats grid, badges, level progression, logout
9. **Create Challenge** - 4-step flow with pot configuration

## Addiction Engine (NEW)
- **Money Everywhere**: Total pots displayed on home (18,400€+ en jeu), challenge cards show pot amounts
- **Social Pressure**: Dynamic messages ("Alex t'a dépassé", "Tu es #X", "Valide ton défi!")
- **Ranking Widget**: User position, points to next rank, nearby rivals
- **Daily Triggers**: "VALIDE TON DEFI!" red alert when pending
- **Streak Pressure**: Warning on streak loss
- **Badge Advantages**: Earned badges show "+5% XP" bonus

## Features
- Google OAuth login
- Challenge CRUD (create, list, detail, join)
- Proof publishing (image + text)
- Points system (10pts per proof, 5pts per join)
- Level system (level up every 100 pts)
- Streak tracking
- Reputation (earned from proof likes)
- Badge system (6 badges with various conditions)
- Global and per-challenge leaderboards
- Category filters (Sport, Santé, Habitudes, Business, Autre)
- Custom bottom tab bar with prominent publish button

## API Endpoints
- `POST /api/auth/session` - Exchange session_id for token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `GET /api/challenges` - List challenges
- `GET /api/challenges/trending` - Trending challenges
- `GET /api/challenges/{id}` - Challenge detail
- `POST /api/challenges` - Create challenge
- `POST /api/challenges/{id}/join` - Join challenge
- `GET /api/challenges/{id}/leaderboard` - Challenge leaderboard
- `GET /api/my-challenges` - User's active challenges
- `POST /api/proofs` - Submit proof
- `GET /api/proofs` - Get proofs feed
- `POST /api/proofs/{id}/like` - Like proof
- `GET /api/leaderboard` - Global leaderboard
- `GET /api/badges` - All available badges
- `POST /api/seed` - Seed demo data

## Future Enhancements
- Video proof support
- Email/password auth
- Apple sign-in
- Push notifications
- Social feed
- Challenge invitations
- Weekly/monthly rankings
- Achievement system
