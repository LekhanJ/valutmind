import { createMiddleware } from "hono/factory";
import { UnauthorizedError } from "../errors";
import { verify } from "hono/jwt";

const JWT_SECRET = process.env.JWT_SECRET!;

export const authMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header("Authorization");

    if (!authHeader)
        throw new UnauthorizedError("Authorization header missing");

    const token = authHeader.replace("Bearer ", "");

    try {
        const payload = await verify(token, JWT_SECRET, "HS256");
        c.set("user", payload);
        await next();
    } catch {
        throw new UnauthorizedError("Invalid token");
    }
});