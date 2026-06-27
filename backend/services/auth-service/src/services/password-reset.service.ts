import { UnauthorizedError } from "@vaultmind/auth-shared";
import { passwordHasher } from "../lib/password";
import { userRepository } from "../repositories/user.repository";
import { passwordResetRepository } from "../repositories/password-reset.repository";
import { generateOneTimeToken, hashToken } from "../lib/token";
import { publishEvent } from "../lib/events";
import { tokenService } from "./token.service";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes

export const passwordResetService = {

    async requestReset(email: string): Promise<void> {
        const user = await userRepository.findByEmail(email);

        if (!user) {
            return;
        }

        const { rawToken, tokenHash } = generateOneTimeToken();
        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

        await passwordResetRepository.create(user.id, tokenHash, expiresAt);

        await publishEvent("password.reset_requested", {
            userId: user.id,
            email: user.email,
            token: rawToken,
        });
    },

    async confirmReset(rawToken: string, newPassword: string): Promise<void> {
        const tokenHash = hashToken(rawToken);
        const record = await passwordResetRepository.findByHash(tokenHash);

        if (!record || record.usedAt || record.expiresAt < new Date()) {
            throw new UnauthorizedError("Invalid or expired reset token");
        }

        const newPasswordHash = await passwordHasher.hash(newPassword);

        await passwordResetRepository.markUsed(record.id);
        await userRepository.updatePasswordHash(record.userId, newPasswordHash);
        await tokenService.revokeAllRefreshTokens(record.userId);

        const user = await userRepository.findById(record.userId);

        if (user) {
            await publishEvent("password.changed", {
                userId: user.id,
                email: user.email,
            });
        }
    },
};