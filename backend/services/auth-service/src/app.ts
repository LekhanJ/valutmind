import { Hono } from "hono";
import { AppError } from "@vaultmind/auth-shared";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { authRoute } from "./routes/auth.routes";

const app = new Hono();

app.onError((err, c) => {
    if (err instanceof AppError) {
        return c.json({ error: err.message }, err.statusCode as ContentfulStatusCode);
    }

    console.error("Unhandled error:", err);

    return c.json({ error: "Internal Server Error" }, 500);
});

app.route("/auth", authRoute);

export default app;
