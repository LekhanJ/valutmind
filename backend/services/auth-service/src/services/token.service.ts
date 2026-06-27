import { sign } from "hono/jwt";
import { randomBytes } from "node:crypto";
import { AUTH_CONSTANTS, type AccessTokenPayload, type Role } from "@vaultmind/auth-shared";
import { refreshTokenRepository } from "../repositories/refresh-token.repository";
import { hashToken } from "../lib/token";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}

const DEFAULT_AUDIENCE = "vaultmind.services";

export const tokenService = {

    async signAccessToken(userId: string, role: Role): Promise<string> {
        const payload: Omit<AccessTokenPayload, "iat" | "exp"> = {
            sub: userId,
            role,
            jti: randomBytes(16).toString("hex"),
            iss: AUTH_CONSTANTS.ISSUER,
            aud: DEFAULT_AUDIENCE,
        };

        return sign(
            {
                ...payload,
                exp: Math.floor(Date.now() / 1000) + AUTH_CONSTANTS.ACCESS_TOKEN_TTL_SECONDS,
            },
            JWT_SECRET,
            AUTH_CONSTANTS.ALGORITHM
        );
    },

    async issueRefreshToken(userId: string): Promise<string> {
        const rawToken = randomBytes(64).toString("hex");
        const tokenHash = hashToken(rawToken);

        const expiresAt = new Date(
            Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_TTL_SECONDS * 1000
        );

        await refreshTokenRepository.create(userId, tokenHash, expiresAt);

        return rawToken;
    },

    async rotateRefreshToken(rawToken: string): Promise<{ userId: string; newRawToken: string }> {
        const tokenHash = hashToken(rawToken);
        const existing = await refreshTokenRepository.findByHash(tokenHash);

        if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
            throw new Error("INVALID_REFRESH_TOKEN");
        }

        await refreshTokenRepository.revoke(existing.id);

        const newRawToken = await tokenService.issueRefreshToken(existing.userId);

        return { userId: existing.userId, newRawToken };
    },

    /** Revokes a single refresh token (used on logout). */
    async revokeRefreshToken(rawToken: string): Promise<void> {
        const tokenHash = hashToken(rawToken);
        const existing = await refreshTokenRepository.findByHash(tokenHash);

        if (existing) {
            await refreshTokenRepository.revoke(existing.id);
        }
    },

    /** Revokes every refresh token for a user (used on "log out everywhere" / password change). */
    async revokeAllRefreshTokens(userId: string): Promise<void> {
        await refreshTokenRepository.revokeAllForUser(userId);
    },
};
