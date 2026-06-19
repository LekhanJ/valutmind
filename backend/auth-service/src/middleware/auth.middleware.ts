import { createMiddleware } from "hono/factory";

export const authMiddleware = createMiddleware(async (c, next) => {
    const token = c.req.header("Authorization");

    if (!token)
        return c.json({
            message:"Unauthorized"
        }, 401,);

      // verify jwt

      await next();
    }
);