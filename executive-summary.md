# Primordial Pit Fishing - Executive Summary

## Project Overview

Primordial Pit Fishing is an interactive browser-based mini-game developed for the MidEvil NFT community. The game provides an engaging fishing experience where players can catch fantasy-themed fish and compete for rare limited-edition rewards.

**Live URL:** https://midevil-fishing.vercel.app

---

## Key Features

### Gameplay
- **Simple, addictive mechanics** - Cast, wait for a bite, reel in your catch
- **Skill-based timing** - Players must react within 3 seconds when a fish bites
- **70% catch rate** - Adds excitement and replayability with chance of fish escaping
- **10 unique fish species** - Ranging from common (Goblin Guppy) to legendary (Primordial Leviathan)
- **Randomized traits** - Each catch has unique size, color, and special attributes

### Limited-Time Event: Primordial Essence
- **100 total drops** over a 7-day event period
- **Dynamic drop rates** - Algorithm adjusts probability based on remaining essence and days left
- **Scarcity-driven engagement** - Creates urgency and repeat visits
- **Persistent tracking** - Uses Redis database to ensure exactly 100 are distributed globally

### User Experience
- **Wallet-based access** - Players enter Solana wallet address to participate
- **Daily play limit** - One fishing session per wallet per day (admin bypass available)
- **Three fisherman avatars** - Wolf, Golden Pirate, Majestic Beard
- **Full audio experience** - Sound effects for all actions plus background music with mute toggle
- **Mobile optimized** - Responsive design works on desktop, tablet, and phone

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Hosting | Vercel (serverless) |
| Database | Upstash Redis (Primordial Essence tracking) |
| API | Serverless functions for wallet recording and essence claims |

---

## Engagement Strategy

1. **Daily return incentive** - One play per day encourages habitual visits
2. **Rare drop excitement** - Primordial Essence creates viral sharing moments
3. **Collection motivation** - Multiple fish rarities drive completionist behavior
4. **Community building** - Shared experience strengthens MidEvil holder engagement

---

## Metrics & Tracking

- All wallet addresses recorded for analytics
- Primordial Essence claims logged with timestamps
- Real-time remaining essence count available via API

---

## Future Expansion Opportunities

- Leaderboards and catch statistics
- NFT integration for fisherman selection
- Seasonal events with new rare drops
- Trading or showcasing caught fish
- Achievement system and badges

---

**Developed for:** MidEvil NFT Project
**Website:** https://www.midevils.com/
