import { z } from "zod";

const passwordSchema = z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
    email: z.email(),
    password: passwordSchema,
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1, "Password is required"),
});

export const requestPasswordResetSchema = z.object({
    email: z.email(),
});
 
export const confirmPasswordResetSchema = z.object({
    token: z.string().min(1, "Token is required"),
    newPassword: passwordSchema,
});
 
export const confirmEmailVerificationSchema = z.object({
    token: z.string().min(1, "Token is required"),
});
 
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ConfirmPasswordResetInput = z.infer<typeof confirmPasswordResetSchema>;
export type ConfirmEmailVerificationInput = z.infer<typeof confirmEmailVerificationSchema>;