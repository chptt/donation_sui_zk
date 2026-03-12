# 🚀 Quick Start Guide

Get your Aptos donation platform running in 5 minutes!

## Step 1: Install Aptos CLI (2 min)

Open PowerShell as Administrator and run:

```powershell
iwr "https://aptos.dev/scripts/install_cli.py" -useb | iex
```

Verify:
```bash
aptos --version
```

## Step 2: Deploy Smart Contract (2 min)

```bash
cd contracts
aptos init --network testnet
```

When prompted:
- Choose network: `testnet`
- Press Enter to generate new keys

Get testnet tokens:
1. Copy your account address from the output
2. Visit: https://aptoslabs.com/testnet-faucet
3. Paste address and request tokens

Compile and deploy:
```bash
aptos move compile
aptos move publish --named-addresses donation_platform=default
```

Type `yes` when prompted.

**IMPORTANT**: Copy your contract address from the output!

Initialize the platform:
```bash
aptos move run --function-id 'YOUR_ADDRESS::donation_platform::initialize'
```

## Step 3: Setup Frontend (1 min)

```bash
cd ../frontend
npm install
```

Create `.env.local` file:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS_HERE
NEXT_PUBLIC_APTOS_NETWORK=testnet
```

## Step 4: Run & Test

```bash
npm run dev
```

Open http://localhost:3000

### Install Petra Wallet
1. Install from: https://petra.app/
2. Create wallet
3. Switch to Testnet
4. Get testnet tokens from faucet

### Test the Platform
1. Connect wallet on website
2. Create a test campaign
3. Donate to your campaign
4. Check leaderboard

## 🎉 Done!

You now have a fully functional Web3 donation platform!

## Next Steps

- Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed docs
- Customize the UI in `frontend/components/`
- Add more features to the smart contract
- Deploy to production on mainnet

## Common Issues

**"Module not found"**: Did you run the initialize command?

**"Insufficient balance"**: Get more testnet tokens from faucet

**Wallet won't connect**: Make sure Petra is on testnet network

## Need Help?

Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for troubleshooting.
