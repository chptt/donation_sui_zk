# DonateChain - Sui Donation Platform

A decentralized donation platform built on the Sui blockchain. Creators launch charity campaigns, donors contribute SUI tokens, and everything is transparent on-chain.

## Features

- Create charity campaigns with funding goals
- Donate SUI to campaigns
- zkLogin — sign in with Google (no wallet extension needed)
- Traditional wallet support (Sui Wallet, Slush, Suiet)
- Campaign creators cannot donate to their own campaigns
- Real-time progress tracking
- Top donors leaderboard
- Multiple charity categories: Education, Healthcare, Food, Environment

## Tech Stack

- Blockchain: Sui Testnet
- Smart Contract: Move
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Auth: zkLogin (Google OAuth) + dapp-kit wallet connect
- SDK: @mysten/sui, @mysten/dapp-kit

## Quick Start

### 1. Deploy Contract

```bash
cd contracts
sui client publish --gas-budget 100000000
```

### 2. Setup Frontend

```bash
cd frontend
npm install --legacy-peer-deps
```

Create `.env.local`:
```env
NEXT_PUBLIC_PACKAGE_ID=your_package_id
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

```bash
npm run dev
```

Visit http://localhost:3000

### 3. Google OAuth Setup (for zkLogin)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/zklogin-callback`
4. Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local`

## Project Structure

```
contracts/
  sources/donation_platform.move   # Move smart contract
frontend/
  pages/
    index.tsx                      # Campaign listing
    create.tsx                     # Create campaign
    campaign/[id].tsx              # Campaign details + donate
    leaderboard.tsx                # Top donors
    zklogin-callback.tsx           # Google OAuth callback
  components/
    Navbar.tsx                     # Nav + wallet/zkLogin connect
    CampaignCard.tsx               # Campaign card
  lib/
    suiClient.ts                   # Sui client + data fetching
    zkLogin.ts                     # zkLogin utilities
    zkLoginContext.tsx             # zkLogin React context
    walletProvider.tsx             # Provider wrapper
```

## Smart Contract

- `create_campaign(title, description, charity_type, goal_amount)`
- `donate_to_campaign(campaign, coin)` — creators cannot donate to own campaigns
- `withdraw_funds(campaign)` — creator only, closes campaign

## License

MIT
