import { prisma } from "../db/prisma";

export const refreshTokenRepository = {
    async create(userId: string, tokenHash: string, expiresAt: Date) {
        return prisma.refreshToken.create({
            data: { userId, tokenHash, expiresAt },
        });
    },

    async findByHash(tokenHash: string) {
        return prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
    },

    async revoke(id: string) {
        return prisma.refreshToken.update({
            where: { id },
            data: { revokedAt: new Date() },
        });
    },

    async revokeAllForUser(userId: string) {
        return prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    },
};
