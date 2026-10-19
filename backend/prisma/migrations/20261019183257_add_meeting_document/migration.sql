-- DropIndex
DROP INDEX "Event_creatorId_idx";

-- CreateTable
CREATE TABLE "MeetingDocument" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "agenda" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" INTEGER,

    CONSTRAINT "MeetingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingDocument_eventId_key" ON "MeetingDocument"("eventId");

-- AddForeignKey
ALTER TABLE "MeetingDocument" ADD CONSTRAINT "MeetingDocument_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingDocument" ADD CONSTRAINT "MeetingDocument_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
