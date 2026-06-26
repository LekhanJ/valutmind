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
};
