import { createMiddleware } from "hono/factory";
import { TooManyRequestsError } from "@vaultmind/auth-shared";
import { redis } from "../lib/redis";

const INCR_WITH_EXPIRY_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
    redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return current
`;

export function rateLimit(options: { limit: number; windowSeconds: number; keyPrefix: string }) {
    return createMiddleware(async (c, next) => {
        const ip =
            c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
            c.req.header("x-real-ip") ??
            "unknown";

        const key = `ratelimit:${options.keyPrefix}:${ip}`;

        try {
            const count = await redis.eval(
                INCR_WITH_EXPIRY_SCRIPT,
                1,
                key,
                options.windowSeconds
            ) as number;

            if (count > options.limit) {
                throw new TooManyRequestsError("Too many attempts. Please try again later.");
            }
        } catch (err) {
            if (err instanceof TooManyRequestsError) throw err;
            console.error("Rate limiter Redis error, failing open:", err);
        }

        await next();
    });
}