const HASH_OPTIONS = {
    algorithm: "argon2id" as const,
    memoryCost: 19456, // 19 MiB, OWASP minimum recommendation
    timeCost: 2,
};

export const passwordHasher = {
    async hash(plain: string): Promise<string> {
        return Bun.password.hash(plain, HASH_OPTIONS);
    },

    async verify(plain: string, hash: string): Promise<boolean> {
        return Bun.password.verify(plain, hash);
    },
};
