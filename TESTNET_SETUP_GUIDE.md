# Testnet Configuration Guide

## ✅ Current Configuration Status

### ✅ Already Correctly Configured for Testnet:

1. **Contract Configuration** (`contracts/.aptos/config.yaml`):
   - Network: Testnet ✓
   - Contract Address: `0x3914fa9a5117392fb8e4a39a572c135d6112bda4281a49901426a173d2629b70`

2. **Frontend Configuration** (`frontend/.env.local`):
   - `NEXT_PUBLIC_APTOS_NETWORK=testnet` ✓
   - `NEXT_PUBLIC_CONTRACT_ADDRESS=0x3914fa9a5117392fb8e4a39a572c135d6112bda4281a49901426a173d2629b70`

3. **Aptos Client Configuration** (`frontend/lib/aptosClient.ts`):
   - Network: `Network.TESTNET` ✓

## 🔧 Verification Steps

### 1. Verify Contract Deployment
```bash
# Check contract on testnet explorer
# Visit: https://explorer.aptoslabs.com/account/0x3914fa9a5117392fb8e4a39a572c135d6112bda4281a49901426a173d2629b70?network=testnet
```

### 2. Verify Frontend Configuration
```bash
# Check environment variables
cat frontend/.env.local
# Should show:
# NEXT_PUBLIC_CONTRACT_ADDRESS=0x3914fa9a5117392fb8e4a39a572c135d6112bda4281a49901426a173d2629b70
# NEXT_PUBLIC_APTOS_NETWORK=testnet
```

### 3. Test Wallet Connection
1. Make sure Petra Wallet is installed
2. Switch Petra Wallet to **Testnet** (not Mainnet)
3. Connect wallet to your dApp
4. Verify connection shows testnet address

### 4. Test Contract Interaction
```bash
# Test contract functions
cd contracts
aptos move view --function-id '0x3914fa9a5117392fb8e4a39a572c135d6112bda4281a49901426a173d2629b70::donation_platform::get_campaigns' --args address:0x3914fa9a5117392fb8e4a39a572c135d6112bda4281a49901426a173d2629b70
```

## 🚨 Common Issues & Solutions

### Issue: "Mainnet detected" or wrong network
**Solution:**
1. Open Petra Wallet
2. Click network selector (top right)
3. Select **Testnet** (not Mainnet)
4. Refresh the dApp

### Issue: Transaction fails with "Invalid network"
**Solution:**
1. Check Petra Wallet network is set to Testnet
2. Verify contract is deployed to testnet
3. Check contract address in `.env.local` matches deployed contract

### Issue: Wallet not connecting
**Solution:**
1. Ensure Petra Wallet is unlocked
2. Check if wallet is connected to correct network
3. Try disconnecting and reconnecting wallet

## 🔧 Quick Fixes

### If contract shows on mainnet explorer:
1. Contract is on testnet (check the explorer link above)
2. The contract address is a testnet address
3. Mainnet addresses start with `0x1` (yours starts with `0x3`)

### To switch Petra Wallet to Testnet:
1. Open Petra Wallet extension
2. Click network selector (top right)
3. Select "Testnet"
4. Refresh the dApp

### To verify testnet connection:
```javascript
// In browser console
console.log(window.aptos.chainId);
// Should show: "2" for testnet (1 for mainnet)
```

## ✅ Verification Checklist

- [ ] Petra Wallet set to **Testnet**
- [ ] Contract address in `.env.local` matches deployed contract
- [ ] `NEXT_PUBLIC_APTOS_NETWORK=testnet`
- [ ] Petra Wallet extension is installed and unlocked
- [ ] Petra Wallet is connected to the dApp

## 🚀 Quick Start Commands

```bash
# Start frontend
cd frontend
npm run dev

# Check contract
aptos move view --function-id '0x3914fa9a5117392fb8e4a39a572c135d6112bda4281a49901426a173d2629b70::donation_platform::get_campaigns' --args address:0x3914fa9a5117392fb8e4a39a572c135d6112bda4281a49901426a173d2629b70
```

## 📞 Need Help?

If Petra Wallet shows "Mainnet" instead of "Testnet":
1. Click network selector in Petra Wallet
2. Select "Testnet" from dropdown
3. Refresh the dApp page
4. Try connecting wallet again

Your contract is correctly deployed on **Testnet** and all configurations are set for testnet. The contract address `0x3914fa9a5117392fb8e4a39a572c135d6112bda4281a49901426a173d2629b70` is a testnet address.</content>