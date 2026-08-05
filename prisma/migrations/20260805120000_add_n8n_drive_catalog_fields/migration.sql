ALTER TABLE "Catalog"
ADD COLUMN "driveFileId" TEXT,
ADD COLUMN "driveOriginalName" TEXT,
ADD COLUMN "processingStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN "processingError" TEXT,
ADD COLUMN "processedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Catalog_userId_driveFileId_key"
ON "Catalog"("userId", "driveFileId");
