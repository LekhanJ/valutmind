import { UnauthorizedError } from "@vaultmind/auth-shared";
import { userRepository } from "../repositories/user.repository";
import { emailVerificationRepository } from "../repositories/email-verification.repository";
import { generateOneTimeToken, hashToken } from "../lib/token";
import { publishEvent } from "../lib/events";

const VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export const emailVerificationService = {

    async requestVerification(userId: string): Promise<void> {
        const user = await userRepository.findById(userId);

        if (!user) {
            throw new UnauthorizedError("User not found");
        }

        if (user.isVerified) {
            return;
        }

        const { rawToken, tokenHash } = generateOneTimeToken();
        const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

        await emailVerificationRepository.create(user.id, tokenHash, expiresAt);

        await publishEvent("email.verification_requested", {
            userId: user.id,
            email: user.email,
            token: rawToken,
        });
    },

    async confirmVerification(rawToken: string): Promise<void> {
        const tokenHash = hashToken(rawToken);
        const record = await emailVerificationRepository.findByHash(tokenHash);

        if (!record || record.usedAt || record.expiresAt < new Date()) {
            throw new UnauthorizedError("Invalid or expired verification token");
        }

        await emailVerificationRepository.markUsed(record.id);
        await userRepository.markVerified(record.userId);

        const user = await userRepository.findById(record.userId);

        if (user) {
            await publishEvent("email.verified", {
                userId: user.id,
                email: user.email,
            });
        }
    },
};