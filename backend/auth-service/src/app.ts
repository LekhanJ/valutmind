import { Hono } from "hono";

import { authRoute } from "./routes/auth.routes";
import { AppError } from "./errors";
import type { ContentfulStatusCode } from "hono/utils/http-status";

const app = new Hono();

app.onError((err, c) => {
    console.log(err);
    
    if (err instanceof AppError) {
        return c.json({
            error: err.message
        }, err.statusCode as ContentfulStatusCode)
    }

    return c.json({
        error: "Internal Server Error"
    }, 500)
});

app.route("/auth", authRoute);

export default app;