import { ConflictError, UnauthorizedError } from "@vaultmind/auth-shared";
import { passwordHasher } from "../lib/password";
import { publishEvent } from "../lib/events";
import { userRepository } from "../repositories/user.repository";
import { tokenService } from "./token.service";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema";

type AuthResult = {
    accessToken: string;
    refreshToken: string;
};

export const authService = {
    async register(data: RegisterInput): Promise<AuthResult> {
        const existingUser = await userRepository.findByEmail(data.email);

        if (existingUser) {
            throw new ConflictError("User already exists");
        }

        const passwordHash = await passwordHasher.hash(data.password);
        const user = await userRepository.createUser(data.email, passwordHash);

        const accessToken = await tokenService.signAccessToken(user.id, user.role);
        const refreshToken = await tokenService.issueRefreshToken(user.id);

        await publishEvent("user.created", {
            userId: user.id,
            email: user.email,
        });

        return { accessToken, refreshToken };
    },

    async login(data: LoginInput): Promise<AuthResult> {
        const user = await userRepository.findByEmail(data.email);

        const isValid = await passwordHasher.verify(
            data.password,
            user?.passwordHash ?? (await getDummyHash())
        );

        if (!user || !isValid) {
            throw new UnauthorizedError("Invalid credentials");
        }

        const accessToken = await tokenService.signAccessToken(user.id, user.role);
        const refreshToken = await tokenService.issueRefreshToken(user.id);

        await publishEvent("user.logged_in", {
            userId: user.id,
            email: user.email,
        });

        return { accessToken, refreshToken };
    },

    async refresh(rawRefreshToken: string): Promise<AuthResult> {
        let userId: string;
        let newRawToken: string;

        try {
            const result = await tokenService.rotateRefreshToken(rawRefreshToken);
            userId = result.userId;
            newRawToken = result.newRawToken;
        } catch {
            throw new UnauthorizedError("Invalid or expired refresh token");
        }

        const user = await userRepository.findById(userId);

        if (!user) {
            throw new UnauthorizedError("Invalid or expired refresh token");
        }

        const accessToken = await tokenService.signAccessToken(user.id, user.role);

        return { accessToken, refreshToken: newRawToken };
    },

    async logout(rawRefreshToken: string): Promise<void> {
        await tokenService.revokeRefreshToken(rawRefreshToken);
    },
};


let dummyHashPromise: Promise<string> | null = null;

function getDummyHash(): Promise<string> {
    if (!dummyHashPromise) {
        dummyHashPromise = passwordHasher.hash("vaultmind-dummy-password-for-timing-safety");
    }
    return dummyHashPromise;
}
