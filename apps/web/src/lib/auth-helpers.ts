import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isDemo } from "@/lib/demo";

const DEMO_ORG_ID = "demo-org-1";
const DEMO_USER_ID = "demo-user-1";

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  defaultOrgId: string;
}

/**
 * Require a valid session, redirect to signin if not authenticated
 * In demo mode, returns a demo user
 */
export async function requireSession(): Promise<SessionUser> {
  if (isDemo()) {
    return {
      id: DEMO_USER_ID,
      email: "demo@trustops.app",
      name: "Demo User",
      defaultOrgId: DEMO_ORG_ID,
    };
  }

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin");
  }

  return {
    id: (session.user as { id?: string }).id || DEMO_USER_ID,
    email: session.user.email,
    name: session.user.name || undefined,
    defaultOrgId: (session.user as { defaultOrgId?: string }).defaultOrgId || DEMO_ORG_ID,
  };
}

/**
 * Get session if available, returns null if not authenticated
 * In demo mode, returns a demo user
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (isDemo()) {
    return {
      id: DEMO_USER_ID,
      email: "demo@trustops.app",
      name: "Demo User",
      defaultOrgId: DEMO_ORG_ID,
    };
  }

  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  return {
    id: (session.user as { id?: string }).id || DEMO_USER_ID,
    email: session.user.email,
    name: session.user.name || undefined,
    defaultOrgId: (session.user as { defaultOrgId?: string }).defaultOrgId || DEMO_ORG_ID,
  };
}

/**
 * Get the current organization ID
 */
export async function getOrgId(): Promise<string> {
  const user = await getSessionUser();
  return user?.defaultOrgId || DEMO_ORG_ID;
}

/**
 * Check if user has a specific role in the org
 * In demo mode, always returns true for OWNER role
 */
export async function hasRole(requiredRole: "OWNER" | "ADMIN" | "MEMBER" | "AUDITOR"): Promise<boolean> {
  if (isDemo()) {
    return true; // Demo user has all permissions
  }

  const session = await auth();
  if (!session?.user) {
    return false;
  }

  // In production, check membership role in database
  const { prisma } = await import("@trustops/db");
  const userId = (session.user as { id?: string }).id;
  const orgId = (session.user as { defaultOrgId?: string }).defaultOrgId;

  if (!userId || !orgId) {
    return false;
  }

  const membership = await prisma.membership.findUnique({
    where: {
      orgId_userId: { orgId, userId },
    },
  });

  if (!membership) {
    return false;
  }

  // Role hierarchy: OWNER > ADMIN > MEMBER > AUDITOR
  const roleHierarchy = ["AUDITOR", "MEMBER", "ADMIN", "OWNER"];
  const userRoleIndex = roleHierarchy.indexOf(membership.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Require a specific role, throw if not authorized
 */
export async function requireRole(requiredRole: "OWNER" | "ADMIN" | "MEMBER" | "AUDITOR"): Promise<void> {
  const hasAccess = await hasRole(requiredRole);
  if (!hasAccess) {
    throw new Error(`Unauthorized: requires ${requiredRole} role`);
  }
}
