# Vercel Deployment Guide

## 🚀 Quick Deployment

### Option 1: One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fchptt%2Fdonation_aptos&project-name=aptos-donation-platform&repository-name=donation_aptos&root-directory=frontend&demo-title=Aptos%20Donation%20Platform&demo-description=Blockchain-powered%20donation%20platform%20on%20Aptos&demo-url=https%3A%2F%2Fdonation-aptos.vercel.app&demo-image=https%3A%2F%2Fimages.unsplash.com%2Fphoto-1551288049-bebda4e38f71%3Fauto%3Dformat%26fit%3Dcrop%26w%3D1200%26q%3D80)

### Option 2: Manual Deployment

#### Step 1: Prepare Your Repository
```bash
# Clone your repository
git clone https://github.com/chptt/donation_aptos.git
cd donation_aptos/frontend
```

#### Step 2: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import: `chptt/donation_aptos`
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

#### Step 3: Set Environment Variables
In Vercel project settings → Environment Variables:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x3914fa9a5117392fb8e4a39a572c135d6112bda4281a49901426a173d2629b70
NEXT_PUBLIC_APTOS_NETWORK=testnet
```

#### Step 4: Deploy
Click "Deploy" and wait for build to complete.

## 📦 Project Structure for Vercel

```
frontend/                    # Vercel deployment root
├── package.json            # Dependencies & scripts
├── next.config.js         # Next.js configuration
├── vercel.json           # Vercel configuration
├── public/               # Static assets
├── pages/               # Next.js pages
├── components/          # React components
└── lib/                 # Utility functions
```

## 🔧 Configuration Files

### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_APTOS_NETWORK: process.env.NEXT_PUBLIC_APTOS_NETWORK,
  },
};
```

## 🌐 Domain Configuration (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## 🔍 Testing Deployment

After deployment:
1. Visit your Vercel URL (e.g., `https://donation-aptos.vercel.app`)
2. Test wallet connection
3. Test campaign creation
4. Test donation functionality

## 🐛 Common Issues & Solutions

### Issue: Build fails
**Solution:**
- Check Node.js version (requires 18+)
- Check environment variables are set
- Check `package.json` scripts

### Issue: Wallet not connecting
**Solution:**
- Ensure Petra Wallet is installed
- Check if site is HTTPS (Vercel provides this)
- Test on different browser

### Issue: Environment variables missing
**Solution:**
- Add variables in Vercel dashboard
- Redeploy after adding variables

## 📊 Monitoring

After deployment, monitor:
- **Vercel Analytics**: Performance metrics
- **Console Logs**: Error tracking
- **Uptime**: Site availability

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to:
- `main` branch → Production
- Other branches → Preview deployments

## 🎯 Production Checklist

- [ ] Environment variables set
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Analytics configured (optional)
- [ ] Error tracking set up

## 💡 Tips for Success

1. **Use Preview Deployments**: Test on feature branches
2. **Monitor Build Logs**: Check for warnings/errors
3. **Set Up Alerts**: Get notified of deployment issues
4. **Use Vercel Analytics**: Track performance

## 🆘 Support

- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Project Issues: GitHub repository issues

Your Aptos donation platform is ready for Vercel deployment! 🚀