import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { registerSchema } from "../schemas/auth.schema";
import { authService } from "../services/auth.service";

export const authRoute = new Hono();

authRoute.post("/register", zValidator("json", registerSchema), async (c) => {
    const data = c.req.valid("json");

    await authService.register(data);

    return c.json({
        message: "User created successfully"
    }, 201);
});

authRoute.post("/login", )