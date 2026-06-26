export type AccessTokenPayload = {
    // User ID (subject)
    sub: string;
    // User's role, used for authorization checks
    role: Role;
    // JWT ID — unique per token, used for auditing/targeted revocation
    jti: string;
    // Issued-at, set automatically by hono/jwt sign()
    iat: number;
    // Expiry, set automatically by hono/jwt sign()
    exp: number;
    // Issuer — always "vaultmind.auth-service"
    iss: string;
    // Audience — which services this token is valid for
    aud: string;
};

export type Role = "USER" | "ADMIN";

export type AuthVariables = {
    user: AccessTokenPayload;
};

export const AUTH_CONSTANTS = {
    ISSUER: "vaultmind.auth-service",
    ACCESS_TOKEN_TTL_SECONDS: 60 * 15, // 15 minutes
    REFRESH_TOKEN_TTL_SECONDS: 60 * 60 * 24 * 30, // 30 days
    REFRESH_COOKIE_NAME: "refresh_token",
    ALGORITHM: "HS256" as const,
} as const;
