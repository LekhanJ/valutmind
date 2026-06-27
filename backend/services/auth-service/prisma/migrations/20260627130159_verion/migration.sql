/*
  Warnings:

  - A unique constraint covering the columns `[tokenHash]` on the table `email_verification_tokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tokenHash]` on the table `password_reset_tokens` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "email_verification_tokens" ADD COLUMN     "usedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "password_reset_tokens" ADD COLUMN     "usedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON "email_verification_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");
