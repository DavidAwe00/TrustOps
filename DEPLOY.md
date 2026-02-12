# 🚀 Deploy TrustOps to Vercel

## Step 1: Push to GitHub

If you don't have a GitHub repo yet:

```bash
# Create a new repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

If you already have a repo:

```bash
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `apps/web` (or leave default, Vercel will use vercel.json)
   - **Build Command**: `npm run build` (from root)
   - **Output Directory**: `apps/web/.next`
   - **Install Command**: `npm install`

5. **Add Environment Variables** (click "Environment Variables"):
   
   **Required:**
   ```
   DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-flat-firefly-ak6j8hv8-pooler.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   
   DIRECT_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-flat-firefly-ak6j8hv8.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require
   
   AUTH_SECRET=<generate with: openssl rand -base64 32>
   
   AUTH_URL=https://your-app.vercel.app
   
   TRUSTOPS_DEMO=0
   
   EMAIL_SERVER=smtp://api.resend.com:587
   EMAIL_FROM=noreply@yourdomain.com
   RESEND_API_KEY=re_xxxxx
   ```

   **Optional but recommended:**
   ```
   ENCRYPTION_KEY=<generate with: openssl rand -hex 32>
   CRON_SECRET=<generate with: openssl rand -base64 32>
   OPENAI_API_KEY=sk-xxxxx
   ```

6. Click **"Deploy"**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project (from repo root)
vercel link

# Add environment variables
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add AUTH_SECRET
vercel env add AUTH_URL
vercel env add TRUSTOPS_DEMO
vercel env add EMAIL_SERVER
vercel env add EMAIL_FROM

# Deploy
vercel --prod
```

## Step 3: Run Database Migrations

After deployment, you need to run migrations on the production database:

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-neon-url"
export DIRECT_URL="your-production-neon-direct-url"

# Run migrations
npm run db:migrate

# Optional: Seed initial data
npm run db:seed
```

**Or use Vercel's CLI to run migrations:**

```bash
vercel env pull .env.production
npm run db:migrate
```

## Step 4: Verify Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Check health endpoint: `https://your-app.vercel.app/api/health`
3. Test signup/signin flow
4. Upload a test evidence file

## Step 5: Set Up Email (Resend - Free Tier)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain (or use their test domain)
3. Get API key from dashboard
4. Add to Vercel env vars:
   - `EMAIL_SERVER=smtp://api.resend.com:587`
   - `EMAIL_FROM=noreply@yourdomain.com` (or `onboarding@resend.dev` for testing)
   - `RESEND_API_KEY=re_xxxxx`

## Troubleshooting

### Build fails
- Check Vercel build logs
- Ensure `vercel.json` is correct
- Verify all dependencies are in `package.json`

### Database connection errors
- Verify `DATABASE_URL` and `DIRECT_URL` are set correctly
- Check Neon dashboard for connection limits
- Ensure SSL mode is `require`

### Auth not working
- Verify `AUTH_SECRET` is set
- Check `AUTH_URL` matches your Vercel domain
- Ensure `TRUSTOPS_DEMO=0` in production

### Email not sending
- Check Resend dashboard for logs
- Verify API key is correct
- Check spam folder
