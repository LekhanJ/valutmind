import { sign } from "hono/jwt";
import { ConflictError, UnauthorizedError } from "../errors";
import { publishEvent } from "../lib/events";
import { userRepository } from "../repositories/user.repository";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema";

const JWT_SECRET = process.env.JWT_SECRET!;

export const authService = {

    async register(data: RegisterInput) {
        const existingUser = await userRepository.findByEmail(data.email);

        if (existingUser)
            throw new ConflictError("User already exists");

        const passwordHash = await Bun.password.hash(data.password);

        const user = await userRepository.createUser(data.email, passwordHash);

        const accessToken = await sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + 60 * 15
        }, JWT_SECRET);

        await publishEvent("user.created", {
            userId: user.id,
            email: user.email
        });

        return {
            accessToken
        }
    },

    async login(data: LoginInput) {
        const user = await userRepository.findByEmail(data.email);

        if (!user)
            throw new UnauthorizedError("Invalid credentials");

        const isValid = await Bun.password.verify(data.password, user.passwordHash);

        if (!isValid)
            throw new UnauthorizedError("Invalid credentials");

        const accessToken = await sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + 60 * 15
        }, JWT_SECRET);
        
        await publishEvent("user.logged_in", {
            userId: user.id,
            email: user.email
        });

        return {
            accessToken
        }
    }
}