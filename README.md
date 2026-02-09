# TrustOps

**Compliance & Trust Automation Platform**

A multi-tenant SaaS application for automating SOC2, ISO27001, and other compliance frameworks. Connects to GitHub, AWS, and other integrations to automatically collect evidence, map to controls, and generate audit packets.

![TrustOps Dashboard](docs/dashboard-preview.png)

## Features

- 🛡️ **Control Management** — Browse SOC2 and ISO27001 controls with coverage tracking
- 📁 **Evidence Collection** — Upload manual evidence or auto-collect from integrations
- 🔗 **Integrations** — Connect GitHub (OAuth) and AWS (AssumeRole) for automated evidence
- ✅ **Approval Workflow** — Review and approve evidence before audit inclusion
- 📦 **Audit Packet Export** — Generate ZIP files organized by framework/control
- 🤖 **AI Copilot** — Gap analysis, policy drafting, and questionnaire answers with citations
- 👥 **Multi-Tenant** — Organization-based isolation with RBAC (Owner, Admin, Member, Auditor)

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Auth.js (NextAuth) with email magic link
- **Jobs**: BullMQ + Redis (planned) or DB-backed runner
- **Storage**: S3-compatible (local dev uses filesystem)
- **AI**: Provider-agnostic interface (OpenAI, Anthropic, etc.)

## Project Structure

```
TrustOps/
├── apps/
│   └── web/                 # Next.js application
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   ├── components/  # React components (shadcn/ui)
│       │   ├── lib/         # Utilities and helpers
│       │   └── auth.ts      # Auth.js configuration
│       └── ...
├── packages/
│   ├── db/                  # Prisma schema and client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   └── shared/              # Shared types, utilities, RBAC
│       └── src/
└── package.json             # Root workspace config
```

## Local Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)
- SMTP server for magic links (optional, use Mailhog for dev)

### 1. Clone and Install

```bash
git clone https://github.com/your-org/trustops.git
cd trustops
npm install
```

### 2. Environment Variables

Create `.env` file in the root:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trustops?schema=public"

# Auth.js
AUTH_SECRET="your-random-secret-min-32-chars"  # Generate: openssl rand -base64 32
AUTH_URL="http://localhost:3000"

# Email (for magic links)
EMAIL_SERVER="smtp://localhost:1025"  # Mailhog default
EMAIL_FROM="noreply@trustops.local"

# Optional: Demo mode (bypasses auth and uses static data)
TRUSTOPS_DEMO=1
```

### 3. Database Setup

**Option A: Local PostgreSQL**

```bash
createdb trustops
npm run db:migrate
npm run db:seed
```

**Option B: Docker Compose** (recommended)

```bash
# Start Postgres + Mailhog
docker compose up -d

# Run migrations and seed
npm run db:migrate
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Demo Mode (No Database Required)

To preview the UI without setting up a database:

```bash
TRUSTOPS_DEMO=1 npm run dev
```

This uses static demo data for controls, evidence, and frameworks.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed frameworks and controls |
| `npm run db:studio` | Open Prisma Studio |

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes* | PostgreSQL connection string |
| `AUTH_SECRET` | Yes* | Auth.js session encryption key |
| `AUTH_URL` | Yes* | Base URL for auth callbacks |
| `EMAIL_SERVER` | Yes* | SMTP connection string |
| `EMAIL_FROM` | Yes* | From address for magic links |
| `TRUSTOPS_DEMO` | No | Set to `1` to enable demo mode |
| `GITHUB_CLIENT_ID` | No | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | No | GitHub OAuth app secret |
| `AWS_ROLE_ARN` | No | AWS AssumeRole ARN for collectors |
| `AWS_EXTERNAL_ID` | No | External ID for AssumeRole |
| `OPENAI_API_KEY` | No | OpenAI API key for AI features |
| `ANTHROPIC_API_KEY` | No | Anthropic API key for AI features |

*Not required in demo mode (`TRUSTOPS_DEMO=1`)

## Security Notes

### Authentication

- Uses Auth.js with email magic links (passwordless)
- Sessions stored in database with secure cookies
- CSRF protection enabled by default

### Multi-Tenancy

- All data is scoped by `orgId` at the database level
- Prisma middleware enforces tenant isolation
- API routes validate org membership before access

### Secrets Management

- **Never commit `.env` files** — they're in `.gitignore`
- Use environment variables for all secrets
- Rotate `AUTH_SECRET` periodically

### Integrations

- **GitHub**: OAuth tokens are encrypted at rest
- **AWS**: Uses AssumeRole with external ID (no long-lived credentials stored)

### AI Features

- All AI actions are logged to `audit_logs`
- Generated content requires human approval before publishing
- Citations are verified against actual evidence

## Roadmap

- [x] Phase 1: Foundation (monorepo, auth, schema, seed data)
- [x] Phase 2: Evidence Center (upload, mapping, approvals)
- [x] Phase 3: Integrations (scaffolded, ready for OAuth)
- [x] Phase 4: Audit Packet Export (ZIP with controls/evidence)
- [x] Phase 5: Agentic AI (gap analysis, policy drafts, Q&A)

### Next Steps for Production

- [ ] Connect PostgreSQL database (Supabase, Neon, or Railway)
- [ ] Configure email provider (Resend) for magic links
- [ ] Add OpenAI/Anthropic API key for AI features
- [ ] Set up S3/R2 for file storage
- [ ] Deploy to Vercel

## Deployment

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-org/trustops)

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Required Environment Variables for Production

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Session encryption key |
| `AUTH_URL` | Your app URL (e.g., https://app.trustops.io) |
| `EMAIL_SERVER` | SMTP connection or Resend API |
| `EMAIL_FROM` | From address for emails |
| `OPENAI_API_KEY` | For AI features (or `ANTHROPIC_API_KEY`) |

See `docs/SHIPPING_CHECKLIST.md` for complete deployment guide.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

