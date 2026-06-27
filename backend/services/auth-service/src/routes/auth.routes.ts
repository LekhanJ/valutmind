import { zValidator } from "@hono/zod-validator";
import { Hono, type Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { AUTH_CONSTANTS, UnauthorizedError, createAuthMiddleware, type AuthVariables } from "@vaultmind/auth-shared";
import {
    loginSchema,
    registerSchema,
    requestPasswordResetSchema,
    confirmPasswordResetSchema,
    confirmEmailVerificationSchema,
} from "../schemas/auth.schema";
import { authService } from "../services/auth.service";
import { emailVerificationService } from "../services/email-verification.service";
import { passwordResetService } from "../services/password-reset.service";
import { rateLimit } from "../middleware/rate-limit.middleware";

const JWT_SECRET = process.env.JWT_SECRET!;
const authenticate = createAuthMiddleware(JWT_SECRET, "vaultmind.services");

export const authRoute = new Hono<{ Variables: AuthVariables }>();

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/auth", // only sent back to auth endpoints, not every route
    maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_TTL_SECONDS,
};

function setRefreshCookie(c: Context, token: string) {
    setCookie(c, AUTH_CONSTANTS.REFRESH_COOKIE_NAME, token, REFRESH_COOKIE_OPTIONS);
}

authRoute.post(
    "/register",
    rateLimit({ limit: 5, windowSeconds: 60, keyPrefix: "register" }),
    zValidator("json", registerSchema),
    async (c) => {
        const data = c.req.valid("json");
        const { accessToken, refreshToken } = await authService.register(data);

        setRefreshCookie(c, refreshToken);

        return c.json({ accessToken }, 201);
    }
);

authRoute.post(
    "/login",
    rateLimit({ limit: 10, windowSeconds: 60, keyPrefix: "login" }),
    zValidator("json", loginSchema),
    async (c) => {
        const data = c.req.valid("json");
        const { accessToken, refreshToken } = await authService.login(data);

        setRefreshCookie(c, refreshToken);

        return c.json({ accessToken });
    }
);

authRoute.post(
    "/refresh",
    rateLimit({ limit: 20, windowSeconds: 60, keyPrefix: "refresh" }),
    async (c) => {
        const rawRefreshToken = getCookie(c, AUTH_CONSTANTS.REFRESH_COOKIE_NAME);

        if (!rawRefreshToken) {
            throw new UnauthorizedError("Refresh token missing");
        }

        const { accessToken, refreshToken } = await authService.refresh(rawRefreshToken);

        setRefreshCookie(c, refreshToken);

        return c.json({ accessToken });
    }
);

authRoute.post("/logout", async (c) => {
    const rawRefreshToken = getCookie(c, AUTH_CONSTANTS.REFRESH_COOKIE_NAME);

    if (rawRefreshToken) {
        await authService.logout(rawRefreshToken);
    }

    deleteCookie(c, AUTH_CONSTANTS.REFRESH_COOKIE_NAME, { path: "/auth" });

    return c.body(null, 204);
});

authRoute.post(
    "/resend-verification",
    authenticate,
    rateLimit({ limit: 3, windowSeconds: 300, keyPrefix: "resend-verification" }),
    async (c) => {
        const user = c.get("user");

        await emailVerificationService.requestVerification(user.sub);

        return c.body(null, 204);
    }
);

authRoute.post(
    "/verify-email",
    rateLimit({ limit: 10, windowSeconds: 60, keyPrefix: "verify-email" }),
    zValidator("json", confirmEmailVerificationSchema),
    async (c) => {
        const { token } = c.req.valid("json");

        await emailVerificationService.confirmVerification(token);

        return c.body(null, 204);
    }
);

authRoute.post(
    "/request-password-reset",
    rateLimit({ limit: 5, windowSeconds: 300, keyPrefix: "request-password-reset" }),
    zValidator("json", requestPasswordResetSchema),
    async (c) => {
        const { email } = c.req.valid("json");

        await passwordResetService.requestReset(email);

        return c.body(null, 204);
    }
);

authRoute.post(
    "/reset-password",
    rateLimit({ limit: 10, windowSeconds: 60, keyPrefix: "reset-password" }),
    zValidator("json", confirmPasswordResetSchema),
    async (c) => {
        const { token, newPassword } = c.req.valid("json");

        await passwordResetService.confirmReset(token, newPassword);

        return c.body(null, 204);
    }
);