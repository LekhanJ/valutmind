import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { authService } from "../services/auth.service";
import { authMiddleware } from "../middleware/auth.middleware";

export const authRoute = new Hono();

authRoute.post("/register", zValidator("json", registerSchema), async (c) => {
    const data = c.req.valid("json");

    const result = await authService.register(data);

    return c.json(result, 201);
});

authRoute.post("/login", zValidator("json", loginSchema), async (c) => {
    const data = c.req.valid("json");

    const result = await authService.login(data);

    return c.json(result);
});
