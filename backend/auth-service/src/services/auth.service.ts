import { ConflictError } from "../errors";
import { publishEvent } from "../lib/events";
import { userRepository } from "../repositories/user.repository";
import type { RegisterInput } from "../schemas/auth.schema";

export const authService = {

    async register(data: RegisterInput) {
        const existingUser = await userRepository.findByEmail(data.email);

        if (existingUser)
            throw new ConflictError("User already exists");

        const passwordHash = await Bun.password.hash(data.password);

        const user = await userRepository.createUser(data.email, passwordHash);

        await publishEvent("user.created", {
            userId: user.id,
            email: user.email
        });
    },

}