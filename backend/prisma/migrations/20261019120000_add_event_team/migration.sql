ALTER TABLE "Event" ADD COLUMN "teamId" TEXT;

ALTER TABLE "Event"
ADD CONSTRAINT "Event_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Event_teamId_idx" ON "Event"("teamId");
