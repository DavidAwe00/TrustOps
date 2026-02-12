/**
 * Demo mode check.
 * Returns true when TRUSTOPS_DEMO=1.
 *
 * SAFETY: Demo mode is blocked in production (NODE_ENV=production)
 * to prevent accidentally bypassing authentication.
 */
export function isDemo(): boolean {
  if (process.env.TRUSTOPS_DEMO !== "1") {
    return false;
  }

  // Safety: never allow demo mode in production
  if (process.env.NODE_ENV === "production") {
    console.error(
      "[TrustOps] CRITICAL: TRUSTOPS_DEMO=1 is set in production. " +
      "Demo mode is disabled in production to prevent auth bypass. " +
      "Remove TRUSTOPS_DEMO from your production environment."
    );
    return false;
  }

  return true;
}