CREATE TABLE "OAuthAccount" (
    "provider" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("provider","subject")
);

CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

ALTER TABLE "OAuthAccount"
ADD CONSTRAINT "OAuthAccount_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
