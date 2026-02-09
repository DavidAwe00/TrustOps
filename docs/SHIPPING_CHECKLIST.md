# TrustOps Shipping Checklist

## 🚀 Ready to Ship Checklist

### Critical (Must Have)

- [ ] **Database Integration**
  - [ ] Set up production PostgreSQL (Supabase, Neon, PlanetScale, or Railway)
  - [ ] Run `npm run db:migrate` and `npm run db:seed`
  - [ ] Verify Prisma queries work without `TRUSTOPS_DEMO`

- [ ] **Authentication**
  - [ ] Configure email provider (Resend recommended - free tier: 3k emails/month)
  - [ ] Set `AUTH_SECRET` (generate with `openssl rand -base64 32`)
  - [ ] Test magic link flow end-to-end

- [ ] **AI Integration**
  - [ ] Add OpenAI or Anthropic API key
  - [ ] Update AI service to use real API calls
  - [ ] Set reasonable token limits and rate limiting

- [ ] **File Storage**
  - [ ] Set up S3/R2/Supabase Storage for evidence files
  - [ ] Configure bucket CORS for uploads
  - [ ] Update storage.ts to use cloud provider

- [ ] **Environment Variables**
  - [ ] All secrets in env vars (never in code)
  - [ ] Create `.env.production` or use platform secrets

### Important (Should Have)

- [ ] **Error Handling**
  - [ ] Add error boundaries for React components
  - [ ] Improve API error responses
  - [ ] Add toast notifications for user feedback

- [ ] **Loading States**
  - [ ] Skeleton loaders for data fetching
  - [ ] Optimistic updates for better UX

- [ ] **Security**
  - [ ] Rate limiting on API routes
  - [ ] Input validation with Zod on all endpoints
  - [ ] CSRF tokens verified

- [ ] **Monitoring**
  - [ ] Set up Sentry for error tracking
  - [ ] Add basic analytics (PostHog, Plausible)
  - [ ] Health check endpoint

### Nice to Have

- [ ] **Testing**
  - [ ] Unit tests for critical paths
  - [ ] E2E tests for main flows (Playwright)

- [ ] **Performance**
  - [ ] React Query for caching
  - [ ] Image optimization
  - [ ] Bundle analysis

- [ ] **Documentation**
  - [ ] API documentation
  - [ ] User onboarding guide

---

## 📋 Step-by-Step Deployment Guide

### Option 1: Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project
vercel link

# 3. Add environment variables
vercel env add DATABASE_URL
vercel env add AUTH_SECRET
vercel env add AUTH_URL
vercel env add EMAIL_SERVER
vercel env add EMAIL_FROM
vercel env add OPENAI_API_KEY

# 4. Deploy
vercel --prod
```

### Option 2: Docker

```dockerfile
# Dockerfile included - see /Dockerfile
docker build -t trustops .
docker run -p 3000:3000 --env-file .env trustops
```

### Option 3: Railway/Render

1. Connect GitHub repository
2. Add environment variables in dashboard
3. Deploy automatically on push

---

## 🔧 Quick Fixes Needed

### 1. Replace Demo Store with Prisma

Currently using in-memory stores. Replace with Prisma queries:

```typescript
// Before (demo-store.ts)
export function getEvidenceItems() {
  return demoEvidenceItems;
}

// After (with Prisma)
export async function getEvidenceItems(orgId: string) {
  return prisma.evidenceItem.findMany({
    where: { orgId },
    include: { files: true, controlEvidence: true }
  });
}
```

### 2. Add Real AI Calls

```typescript
// lib/ai/service.ts - Replace mock with real API
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function answerQuestion(question: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a compliance expert..." },
      { role: "user", content: question }
    ]
  });
  return response.choices[0].message.content;
}
```

### 3. Add S3 Storage

```typescript
// lib/storage.ts - Add S3 support
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function uploadToS3(file: Buffer, key: string) {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file,
  }));
}
```

---

## 💰 Recommended Stack (Free/Cheap)

| Service | Free Tier | Purpose |
|---------|-----------|---------|
| **Vercel** | Hobby free | Hosting |
| **Supabase** | 500MB DB | PostgreSQL |
| **Resend** | 3k emails/mo | Magic links |
| **Cloudflare R2** | 10GB storage | Evidence files |
| **OpenAI** | Pay-as-you-go | AI features |
| **Sentry** | 5k errors/mo | Error tracking |

**Estimated monthly cost**: $0-20 for MVP stage

---

## 🔐 Security Checklist

- [ ] All env vars use secrets management
- [ ] AUTH_SECRET is unique per environment
- [ ] Database has SSL enabled
- [ ] S3 bucket is private (signed URLs for access)
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all forms
- [ ] SQL injection prevented (Prisma handles this)
- [ ] XSS prevented (React handles this)

---

## 📊 Launch Metrics to Track

1. **Signups** - New user registrations
2. **Activation** - First evidence uploaded
3. **Engagement** - Controls mapped per user
4. **Retention** - Weekly active users
5. **AI Usage** - Gap analyses run, policies generated

