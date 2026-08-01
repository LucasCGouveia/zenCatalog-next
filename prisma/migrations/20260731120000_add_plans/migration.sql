CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanColumn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "position" INTEGER NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 180,
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlanColumn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanRow" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "values" JSONB NOT NULL DEFAULT '{}',
    "planId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlanRow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Plan_userId_updatedAt_idx" ON "Plan"("userId", "updatedAt");
CREATE UNIQUE INDEX "PlanColumn_planId_position_key" ON "PlanColumn"("planId", "position");
CREATE INDEX "PlanColumn_planId_idx" ON "PlanColumn"("planId");
CREATE UNIQUE INDEX "PlanRow_planId_position_key" ON "PlanRow"("planId", "position");
CREATE INDEX "PlanRow_planId_idx" ON "PlanRow"("planId");

ALTER TABLE "Plan" ADD CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanColumn" ADD CONSTRAINT "PlanColumn_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlanRow" ADD CONSTRAINT "PlanRow_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
