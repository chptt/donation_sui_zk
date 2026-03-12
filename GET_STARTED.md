# 🎯 Getting Started with DonateChain

Welcome! This guide will help you get your Aptos donation platform up and running.

## 📚 Documentation Guide

Choose your path:

### 🚀 Quick Setup (5 minutes)
Read: **QUICKSTART.md**
- Fastest way to get running
- Step-by-step commands
- Perfect for testing

### 📖 Detailed Setup (15 minutes)
Read: **DEPLOYMENT_GUIDE.md**
- Comprehensive instructions
- Troubleshooting guide
- Production deployment

### 🏗️ Understanding the Project
Read: **PROJECT_OVERVIEW.md**
- Architecture details
- Design decisions
- Future roadmap

### 📁 File Reference
Read: **FILE_STRUCTURE.txt**
- Complete file tree
- File descriptions
- Code organization

## ⚡ Super Quick Start

```bash
# 1. Install Aptos CLI
iwr "https://aptos.dev/scripts/install_cli.py" -useb | iex

# 2. Deploy contract
cd contracts
aptos init --network testnet
aptos move publish --named-addresses donation_platform=default
aptos move run --function-id 'YOUR_ADDRESS::donation_platform::initialize'

# 3. Setup frontend
cd ../frontend
npm install
# Create .env.local with your contract address
npm run dev
```

## 🎓 Learning Path

### Beginner
1. Read README.md for overview
2. Follow QUICKSTART.md
3. Test on testnet
4. Explore the UI

### Intermediate
1. Read DEPLOYMENT_GUIDE.md
2. Understand smart contract code
3. Customize the frontend
4. Add new features

### Advanced
1. Read PROJECT_OVERVIEW.md
2. Audit smart contract
3. Deploy to mainnet
4. Build additional features

## 🛠️ What You'll Build

A fully functional Web3 donation platform with:
- ✅ Smart contract on Aptos blockchain
- ✅ Beautiful Next.js frontend
- ✅ Petra wallet integration
- ✅ Campaign creation & management
- ✅ Donation functionality
- ✅ Leaderboard system

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Aptos CLI installed
- [ ] Petra Wallet extension installed
- [ ] Basic understanding of blockchain
- [ ] Testnet APT tokens (from faucet)

## 🎯 Success Milestones

1. ✅ Smart contract deployed
2. ✅ Frontend running locally
3. ✅ Wallet connected
4. ✅ Campaign created
5. ✅ Donation made
6. ✅ Leaderboard updated

## 🆘 Need Help?

- **Setup Issues**: Check DEPLOYMENT_GUIDE.md troubleshooting
- **Smart Contract**: Read donation_platform.move comments
- **Frontend**: Check component files in frontend/
- **Wallet**: Visit https://petra.app/docs

## 🔗 Important Links

- Aptos Testnet Faucet: https://aptoslabs.com/testnet-faucet
- Petra Wallet: https://petra.app/
- Aptos Docs: https://aptos.dev/
- Aptos Explorer: https://explorer.aptoslabs.com/

## 🎉 Ready to Start?

Choose your path and dive in! The platform is designed to be easy to set up and customize.

Happy building! 💝
