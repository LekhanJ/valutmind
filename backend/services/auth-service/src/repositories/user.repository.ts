import { prisma } from "../db/prisma";

export const userRepository = {
    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    },

    async findById(id: string) {
        return prisma.user.findUnique({
            where: { id },
        });
    },

    async createUser(email: string, passwordHash: string) {
        return prisma.user.create({
            data: { email, passwordHash },
        });
    },

    async markVerified(userId: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
        });
    },
 
    async updatePasswordHash(userId: string, passwordHash: string) {
        return prisma.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    },
};
