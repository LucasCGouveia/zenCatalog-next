CREATE TABLE "AgendaBoard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Minha Agenda',
    "orientation" TEXT NOT NULL DEFAULT 'STATUS_COLUMNS',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgendaBoard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgendaStatus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "position" INTEGER NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgendaStatus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgendaLane" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "boardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgendaLane_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgendaCard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#FDE68A',
    "dueDate" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "boardId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "laneId" TEXT NOT NULL,
    "noteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgendaCard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgendaBoard_userId_key" ON "AgendaBoard"("userId");
CREATE UNIQUE INDEX "AgendaStatus_boardId_position_key" ON "AgendaStatus"("boardId", "position");
CREATE UNIQUE INDEX "AgendaLane_boardId_position_key" ON "AgendaLane"("boardId", "position");
CREATE INDEX "AgendaCard_boardId_statusId_laneId_idx" ON "AgendaCard"("boardId", "statusId", "laneId");
CREATE INDEX "AgendaCard_noteId_idx" ON "AgendaCard"("noteId");

ALTER TABLE "AgendaBoard" ADD CONSTRAINT "AgendaBoard_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgendaStatus" ADD CONSTRAINT "AgendaStatus_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "AgendaBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgendaLane" ADD CONSTRAINT "AgendaLane_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "AgendaBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgendaCard" ADD CONSTRAINT "AgendaCard_boardId_fkey"
    FOREIGN KEY ("boardId") REFERENCES "AgendaBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgendaCard" ADD CONSTRAINT "AgendaCard_statusId_fkey"
    FOREIGN KEY ("statusId") REFERENCES "AgendaStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgendaCard" ADD CONSTRAINT "AgendaCard_laneId_fkey"
    FOREIGN KEY ("laneId") REFERENCES "AgendaLane"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgendaCard" ADD CONSTRAINT "AgendaCard_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE SET NULL ON UPDATE CASCADE;
