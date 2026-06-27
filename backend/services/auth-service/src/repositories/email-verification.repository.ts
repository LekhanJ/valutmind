import { prisma } from "../db/prisma";

export const emailVerificationRepository = {
    async create(userId: string, tokenHash: string, expiresAt: Date) {
        return prisma.emailVerificationToken.create({
            data: { userId, tokenHash, expiresAt },
        });
    },

    async findByHash(tokenHash: string) {
        return prisma.emailVerificationToken.findUnique({
            where: { tokenHash },
        });
    },

    async markUsed(id: string) {
        return prisma.emailVerificationToken.update({
            where: { id },
            data: { usedAt: new Date() },
        });
    },
};