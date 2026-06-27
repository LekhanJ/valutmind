import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { AUTH_CONSTANTS, type AccessTokenPayload, type AuthVariables } from "./types";

export function extractBearerToken(authHeader: string | undefined): string {
    if (!authHeader) {
        throw new UnauthorizedError("Authorization header missing");
    }

    const match = authHeader.match(/^(\S+)\s+(\S+)$/);

    if (!match) {
        throw new UnauthorizedError("Malformed Authorization header");
    }

    const [, scheme, token] = match;

    if (scheme !== "Bearer") {
        throw new UnauthorizedError("Authorization header must use the Bearer scheme");
    }

    return token;
}

export function createAuthMiddleware(secret: string, audience: string) {
    return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
        const token = extractBearerToken(c.req.header("Authorization"));

        let payload: AccessTokenPayload;

        try {
            payload = (await verify(token, secret, AUTH_CONSTANTS.ALGORITHM)) as AccessTokenPayload;
        } catch {
            throw new UnauthorizedError("Invalid or expired token");
        }

        if (payload.iss !== AUTH_CONSTANTS.ISSUER) {
            throw new UnauthorizedError("Invalid token issuer");
        }

        if (payload.aud !== audience) {
            throw new UnauthorizedError("Token not valid for this service");
        }

        c.set("user", payload);
        await next();
    });
}

export function authorize(...allowedRoles: Array<AccessTokenPayload["role"]>) {
    return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
        const user = c.get("user");

        if (!user) {
            throw new UnauthorizedError("Authentication required");
        }

        if (!allowedRoles.includes(user.role)) {
            throw new ForbiddenError("You do not have permission to perform this action");
        }

        await next();
    });
}
