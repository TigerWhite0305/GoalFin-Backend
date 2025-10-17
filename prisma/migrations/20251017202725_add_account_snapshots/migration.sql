-- CreateTable
CREATE TABLE "public"."account_snapshots" (
    "id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "monthOfYear" INTEGER,
    "year" INTEGER,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "account_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_snapshots_accountId_date_idx" ON "public"."account_snapshots"("accountId", "date");

-- CreateIndex
CREATE INDEX "account_snapshots_userId_date_idx" ON "public"."account_snapshots"("userId", "date");

-- CreateIndex
CREATE INDEX "account_snapshots_date_idx" ON "public"."account_snapshots"("date");

-- AddForeignKey
ALTER TABLE "public"."account_snapshots" ADD CONSTRAINT "account_snapshots_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account_snapshots" ADD CONSTRAINT "account_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
