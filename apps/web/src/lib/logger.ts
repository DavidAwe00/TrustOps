/**
 * Structured Logger
 * Replaces raw console.log/error with structured, leveled logging.
 * In production, outputs JSON for log aggregation (Datadog, Grafana, etc.).
 * In development, outputs human-readable format.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "production" ? "info" : "debug");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Redact sensitive fields from log context */
const SENSITIVE_KEYS = new Set([
  "password",
  "secret",
  "token",
  "accessToken",
  "apiKey",
  "authorization",
  "cookie",
  "creditCard",
]);

function redact(obj: LogContext): LogContext {
  const result: LogContext = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase()) || SENSITIVE_KEYS.has(key)) {
      result[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = redact(value as LogContext);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const safeContext = context ? redact(context) : undefined;

  if (IS_PRODUCTION) {
    // JSON output for log aggregation
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...safeContext,
    });
  }

  // Human-readable for development
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  const contextStr = safeContext ? ` ${JSON.stringify(safeContext)}` : "";
  return `${prefix} ${message}${contextStr}`;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (shouldLog("debug")) {
      console.debug(formatLog("debug", message, context));
    }
  },

  info(message: string, context?: LogContext) {
    if (shouldLog("info")) {
      console.info(formatLog("info", message, context));
    }
  },

  warn(message: string, context?: LogContext) {
    if (shouldLog("warn")) {
      console.warn(formatLog("warn", message, context));
    }
  },

  error(message: string, error?: unknown, context?: LogContext) {
    if (shouldLog("error")) {
      const errorContext: LogContext = { ...context };
      if (error instanceof Error) {
        errorContext.errorName = error.name;
        errorContext.errorMessage = error.message;
        if (!IS_PRODUCTION) {
          errorContext.stack = error.stack;
        }
      } else if (error !== undefined) {
        errorContext.error = String(error);
      }
      console.error(formatLog("error", message, errorContext));
    }
  },

  /** Create a child logger with preset context fields */
  child(defaultContext: LogContext) {
    return {
      debug: (msg: string, ctx?: LogContext) => logger.debug(msg, { ...defaultContext, ...ctx }),
      info: (msg: string, ctx?: LogContext) => logger.info(msg, { ...defaultContext, ...ctx }),
      warn: (msg: string, ctx?: LogContext) => logger.warn(msg, { ...defaultContext, ...ctx }),
      error: (msg: string, err?: unknown, ctx?: LogContext) => logger.error(msg, err, { ...defaultContext, ...ctx }),
    };
  },
};
