import Redis from "ioredis";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
    globalForRedis.redis ??
    new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 3,
        retryStrategy: (attempt) => Math.min(attempt * 100, 2000),
    });

if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis;
}

redis.on("error", (err) => {
    console.error("Redis connection error:", err.message);
});