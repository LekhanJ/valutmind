import { prisma } from "../db/prisma";

export const passwordResetRepository = {
    async create(userId: string, tokenHash: string, expiresAt: Date) {
        return prisma.passwordResetToken.create({
            data: { userId, tokenHash, expiresAt },
        });
    },

    async findByHash(tokenHash: string) {
        return prisma.passwordResetToken.findUnique({
            where: { tokenHash },
        });
    },

    async markUsed(id: string) {
        return prisma.passwordResetToken.update({
            where: { id },
            data: { usedAt: new Date() },
        });
    },
};