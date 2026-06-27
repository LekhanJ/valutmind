import { randomBytes, createHash } from "node:crypto";

export function generateOneTimeToken(): { rawToken: string; tokenHash: string } {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    return { rawToken, tokenHash };
}

export function hashToken(rawToken: string): string {
    return createHash("sha256").update(rawToken).digest("hex");
}