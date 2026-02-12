import NextAuth, { type NextAuthOptions, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@trustops/db";
import { isDemo } from "@/lib/demo";
import { logger } from "@/lib/logger";

// Demo user for development/demo mode
const DEMO_USER: User = {
  id: "demo-user-1",
  email: "demo@trustops.app",
  name: "Demo User",
};

const DEMO_ORG_ID = "demo-org-1";

// Build providers based on environment
function getProviders() {
  const providers: NextAuthOptions["providers"] = [];

  // Always include demo login in demo mode
  if (isDemo()) {
    providers.push(
      CredentialsProvider({
        id: "demo",
        name: "Demo Login",
        credentials: {
          email: { label: "Email", type: "email" },
        },
        async authorize(credentials) {
          return {
            id: DEMO_USER.id,
            email: credentials?.email || DEMO_USER.email,
            name: DEMO_USER.name,
          };
        },
      })
    );
  }

  // Add email provider if configured (for production)
  if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
    providers.push(
      EmailProvider({
        server: process.env.EMAIL_SERVER,
        from: process.env.EMAIL_FROM,
        // Customize magic link email
        sendVerificationRequest: async ({ identifier, url, provider }) => {
          const { host } = new URL(url);
          
          // Use nodemailer to send email
          const nodemailer = await import("nodemailer");
          const transport = nodemailer.createTransport(provider.server);
          
          await transport.sendMail({
            to: identifier,
            from: provider.from,
            subject: `Sign in to TrustOps`,
            text: `Sign in to TrustOps\n\n${url}\n\nIf you didn't request this email, you can safely ignore it.`,
            html: `
              <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif;">
                <h1 style="color: #10b981;">TrustOps</h1>
                <h2>Sign in to your account</h2>
                <p>Click the button below to sign in to TrustOps on ${host}:</p>
                <a href="${url}" 
                   style="display: inline-block; 
                          padding: 12px 24px; 
                          background: #10b981; 
                          color: white; 
                          text-decoration: none; 
                          border-radius: 6px;
                          margin: 16px 0;">
                  Sign in to TrustOps
                </a>
                <p style="color: #6b7280; font-size: 14px;">
                  If you didn't request this email, you can safely ignore it.
                </p>
                <p style="color: #9ca3af; font-size: 12px;">
                  This link expires in 24 hours.
                </p>
              </div>
            `,
          });
        },
      })
    );
  }

  return providers;
}

// ---------------------------------------------------------------------------
// Consolidated: create org + membership for a new user
// ---------------------------------------------------------------------------
async function provisionNewUserOrg(userId: string, email: string, name?: string | null) {
  const orgSlug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-");

  const org = await prisma.org.create({
    data: {
      name: `${name || email}'s Organization`,
      slug: `${orgSlug}-${Date.now()}`,
    },
  });

  await prisma.membership.create({
    data: {
      userId,
      orgId: org.id,
      role: "OWNER",
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { defaultOrgId: org.id },
  });

  // Create default integrations for new org
  await prisma.integration.createMany({
    data: [
      { orgId: org.id, provider: "GITHUB", name: "GitHub", status: "DISCONNECTED" },
      { orgId: org.id, provider: "AWS", name: "AWS", status: "DISCONNECTED" },
    ],
  });

  logger.info("Provisioned new org for user", { userId, orgId: org.id, orgSlug: org.slug });
  return org;
}

// Auth options for NextAuth v4
export const authOptions: NextAuthOptions = {
  // Use Prisma adapter only in production
  adapter: isDemo() ? undefined : PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  
  providers: getProviders(),
  
  session: {
    strategy: isDemo() ? "jwt" : "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  pages: {
    signIn: "/signin",
    signOut: "/signin",
    error: "/signin",
    verifyRequest: "/signin?verify=1",
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.defaultOrgId = DEMO_ORG_ID;
      }
      return token;
    },
    
    async session({ session, token, user }) {
      if (session.user) {
        if (isDemo()) {
          // In demo mode, use token data
          (session.user as { id: string }).id = token.id as string;
          (session.user as { defaultOrgId: string }).defaultOrgId = DEMO_ORG_ID;
        } else {
          // In production, get org from database
          (session.user as { id: string }).id = user.id;
          
          // Get user's default org
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              memberships: {
                include: { org: true },
                take: 1,
              },
            },
          });
          
          if (dbUser?.defaultOrgId) {
            (session.user as { defaultOrgId: string }).defaultOrgId = dbUser.defaultOrgId;
          } else if (dbUser?.memberships[0]) {
            (session.user as { defaultOrgId: string }).defaultOrgId = dbUser.memberships[0].orgId;
          }
        }
      }
      return session;
    },
    
    async signIn({ user, account }) {
      // In production, ensure user has an org
      if (!isDemo() && account?.provider === "email" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { memberships: true },
        });
        
        // If user exists but has no org, create one
        if (existingUser && existingUser.memberships.length === 0) {
          await provisionNewUserOrg(existingUser.id, user.email, user.name);
        }
      }
      
      return true;
    },
  },
  
  events: {
    async createUser({ user }) {
      // Create org and membership for new users
      if (!isDemo() && user.email) {
        await provisionNewUserOrg(user.id, user.email, user.name);
      }
    },
  },
  
  // SECURITY: No fallback secret. AUTH_SECRET must be explicitly set.
  secret: (() => {
    const secret = process.env.AUTH_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error(
        "[TrustOps] AUTH_SECRET environment variable is required in production. " +
        "Generate one with: openssl rand -base64 32"
      );
    }
    // Allow a dev fallback only in non-production
    return secret || "dev-only-secret-do-not-use-in-production";
  })(),
  
  debug: process.env.NODE_ENV === "development",
};

// Default export for API route
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Auth function for server-side session access
import { getServerSession } from "next-auth";

export async function auth() {
  return getServerSession(authOptions);
}
