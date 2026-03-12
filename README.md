# 💝 DonateChain - Aptos Donation Platform

A decentralized donation platform built on Aptos blockchain where creators can launch charity campaigns and users can donate using cryptocurrency. All transactions are transparent, secure, and recorded on-chain.

## ✨ Features

- 🚀 Create charity campaigns with funding goals
- 💰 Donate to campaigns using APT tokens
- 📊 Real-time progress tracking with animated bars
- 🏆 Leaderboard showcasing top donors
- 🔐 Secure wallet integration with Petra
- 🎨 Beautiful, responsive UI with modern design
- 🌍 Multiple charity categories (Education, Healthcare, Food, Environment)
- ⛓️ Fully on-chain with Move smart contracts

## 🛠️ Tech Stack

- **Blockchain**: Aptos Testnet
- **Smart Contract**: Move Language
- **Frontend**: Next.js 14 + TypeScript
- **Wallet**: Petra Wallet
- **Styling**: Tailwind CSS
- **SDK**: Aptos TypeScript SDK

## 📋 Prerequisites

- Node.js 18 or higher
- Aptos CLI
- Petra Wallet browser extension
- Basic understanding of blockchain and Web3

## 🚀 Quick Start

### 1. Install Aptos CLI

```bash
# Windows (PowerShell as Administrator)
iwr "https://aptos.dev/scripts/install_cli.py" -useb | iex

# Verify installation
aptos --version
```

### 2. Deploy Smart Contract

```bash
cd contracts
aptos init --network testnet
aptos move compile
aptos move publish --named-addresses donation_platform=default
```

Get testnet tokens: https://aptoslabs.com/testnet-faucet

**Important**: Initialize the platform after deployment:
```bash
aptos move run --function-id 'YOUR_ADDRESS::donation_platform::initialize'
```

### 3. Setup Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
NEXT_PUBLIC_APTOS_NETWORK=testnet
```

### 4. Run Application

```bash
npm run dev
```

Visit http://localhost:3000

## 📖 Detailed Documentation

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for comprehensive setup instructions, troubleshooting, and production deployment.

## 🎯 How It Works

1. **Connect Wallet**: Users connect their Petra wallet to the platform
2. **Create Campaign**: Creators launch campaigns with title, description, category, and funding goal
3. **Donate**: Users browse campaigns and donate APT tokens
4. **Track Progress**: Real-time progress bars show funding status
5. **Leaderboard**: Top donors are recognized on the leaderboard

## 📁 Project Structure

```
├── contracts/
│   ├── Move.toml
│   └── sources/
│       └── donation_platform.move    # Smart contract
├── frontend/
│   ├── pages/
│   │   ├── index.tsx                 # Home page
│   │   ├── create.tsx                # Create campaign
│   │   ├── leaderboard.tsx           # Top donors
│   │   └── campaign/[id].tsx         # Campaign details
│   ├── components/
│   │   ├── Navbar.tsx                # Navigation
│   │   └── CampaignCard.tsx          # Campaign card
│   └── lib/
│       ├── aptosClient.ts            # Blockchain interaction
│       └── wallet.ts                 # Wallet connection
└── README.md
```

## 🔧 Smart Contract API

### Entry Functions
- `initialize()` - Initialize platform storage (call once)
- `create_campaign(title, description, charity_type, goal_amount, platform_address)`
- `donate_to_campaign(campaign_id, amount, platform_address)`
- `withdraw_funds(campaign_id, platform_address)` - Creator only

### View Functions
- `get_campaigns(platform_address)` - Returns all campaigns
- `get_donations(platform_address)` - Returns all donations
- `get_campaign_count(platform_address)` - Returns total campaigns

## 🎨 Color Palette

- Primary: `#6366f1` (Indigo)
- Secondary: `#8b5cf6` (Purple)
- Accent: `#ec4899` (Pink)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)

## 🔒 Security Features

- Only campaign creators can withdraw funds
- Donations must be greater than 0
- Campaigns can be deactivated
- All transactions require wallet signature
- Smart contract validation on all operations

## 🌐 Deployment

### Testnet (Development)
Already configured for Aptos Testnet. Follow Quick Start guide.

### Mainnet (Production)
1. Switch to mainnet: `aptos init --network mainnet`
2. Deploy contract with real APT
3. Update `.env.local` to use mainnet
4. Deploy frontend to Vercel/Netlify

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🆘 Support

- Aptos Docs: https://aptos.dev/
- Petra Wallet: https://petra.app/
- Aptos Discord: https://discord.gg/aptoslabs

## ⚠️ Disclaimer

This is a demo project for educational purposes. Always audit smart contracts before using in production with real funds.
