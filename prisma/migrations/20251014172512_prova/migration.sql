/*
  Warnings:

  - You are about to drop the `investments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."investments" DROP CONSTRAINT "investments_userId_fkey";

-- DropTable
DROP TABLE "public"."investments";
