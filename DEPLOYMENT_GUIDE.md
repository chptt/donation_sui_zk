# Aptos Donation Platform - Deployment Guide

## Prerequisites

1. **Install Aptos CLI**
   ```bash
   # Windows (PowerShell as Administrator)
   iwr "https://aptos.dev/scripts/install_cli.py" -useb | iex
   
   # Verify installation
   aptos --version
   ```

2. **Install Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

3. **Install Petra Wallet**
   - Chrome Extension: https://petra.app/

## Step 1: Deploy Smart Contract

### 1.1 Initialize Aptos Account

```bash
cd contracts
aptos init --network testnet
```

This will:
- Create `.aptos/config.yaml`
- Generate a new account address
- Save your private key

**Important**: Save your account address - you'll need it later!

### 1.2 Fund Your Account

Visit the Aptos Testnet Faucet:
https://aptoslabs.com/testnet-faucet

Enter your account address and request testnet APT tokens.

### 1.3 Compile the Contract

```bash
aptos move compile
```

Expected output: `Success`

### 1.4 Deploy the Contract

```bash
aptos move publish --named-addresses donation_platform=default
```

When prompted, type `yes` to confirm.

**Save the contract address from the output!**

### 1.5 Initialize the Platform

After deployment, you need to initialize the platform storage:

```bash
aptos move run --function-id 'YOUR_ADDRESS::donation_platform::initialize'
```

Replace `YOUR_ADDRESS` with your account address.

## Step 2: Setup Frontend

### 2.1 Install Dependencies

```bash
cd frontend
npm install
```

### 2.2 Configure Environment

Create `.env.local` file:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
NEXT_PUBLIC_APTOS_NETWORK=testnet
```

Replace `0xYOUR_CONTRACT_ADDRESS` with the address from Step 1.4.

### 2.3 Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## Step 3: Connect Petra Wallet

1. Open Petra Wallet extension
2. Create or import a wallet
3. Switch to **Testnet** network
4. Get testnet tokens from faucet
5. Click "Connect Wallet" on the website

## Step 4: Test the Platform

### Create a Campaign

1. Click "Create" in navigation
2. Fill in campaign details:
   - Title: "Help Build a School"
   - Description: "Raising funds for education"
   - Charity Type: Education
   - Goal: 100 APT
3. Click "Create Campaign"
4. Approve transaction in Petra Wallet

### Make a Donation

1. Go to home page
2. Click on a campaign
3. Enter donation amount
4. Click "Donate"
5. Approve transaction in Petra Wallet

### View Leaderboard

1. Click "Leaderboard" in navigation
2. See top donors ranked by total donations

## Troubleshooting

### "Module not found" error
- Make sure you initialized the platform (Step 1.5)
- Verify contract address in `.env.local`

### "Insufficient balance" error
- Get more testnet tokens from faucet
- Check you're on testnet network

### Wallet connection issues
- Refresh the page
- Disconnect and reconnect wallet
- Make sure Petra is on testnet

### Transaction fails
- Check you have enough APT for gas fees
- Verify campaign is still active
- Ensure donation amount > 0

## Production Deployment

### Deploy to Mainnet

1. Change network to mainnet:
   ```bash
   aptos init --network mainnet
   ```

2. Fund account with real APT tokens

3. Deploy contract:
   ```bash
   aptos move publish --named-addresses donation_platform=default
   ```

4. Update frontend `.env.local`:
   ```
   NEXT_PUBLIC_APTOS_NETWORK=mainnet
   ```

### Deploy Frontend to Vercel

1. Push code to GitHub
2. Import project on Vercel
3. Add environment variables
4. Deploy

## Smart Contract Functions

### Entry Functions (Write)

- `initialize()` - Initialize platform (call once)
- `create_campaign(title, description, charity_type, goal_amount, platform_address)` - Create campaign
- `donate_to_campaign(campaign_id, amount, platform_address)` - Donate to campaign
- `withdraw_funds(campaign_id, platform_address)` - Withdraw funds (creator only)

### View Functions (Read)

- `get_campaign_count(platform_address)` - Get total campaigns
- `get_campaigns(platform_address)` - Get all campaigns
- `get_donations(platform_address)` - Get all donations

## Security Notes

- Never share your private key
- Always verify transaction details before signing
- Test thoroughly on testnet before mainnet
- Campaign creators receive donations directly
- Only creators can close their campaigns

## Support

For issues or questions:
- Aptos Documentation: https://aptos.dev/
- Petra Wallet: https://petra.app/docs
- Aptos Discord: https://discord.gg/aptoslabs
