// This file is used to instrument the Next.js server with Sentry
// and validate environment variables at startup.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  // Validate environment variables early
  const { assertEnv } = await import("./src/lib/env");
  assertEnv();

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (
  err: Error,
  request: Request,
  context: { routerKind: string; routePath: string; routeType: string }
) => {
  const Sentry = await import("@sentry/nextjs");
  
  Sentry.captureException(err, {
    extra: {
      url: request.url,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
  });
};









