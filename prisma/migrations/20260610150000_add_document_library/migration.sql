CREATE TABLE "LibraryDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "extractedText" TEXT NOT NULL,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LibraryDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LibraryDocumentChunk" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "embedding" vector(768),
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LibraryDocumentChunk_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LibraryDocument_userId_createdAt_idx"
    ON "LibraryDocument"("userId", "createdAt");
CREATE UNIQUE INDEX "LibraryDocumentChunk_documentId_position_key"
    ON "LibraryDocumentChunk"("documentId", "position");
CREATE INDEX "LibraryDocumentChunk_documentId_idx"
    ON "LibraryDocumentChunk"("documentId");
CREATE INDEX "LibraryDocumentChunk_embedding_hnsw_idx"
    ON "LibraryDocumentChunk" USING hnsw ("embedding" vector_cosine_ops);

ALTER TABLE "LibraryDocument" ADD CONSTRAINT "LibraryDocument_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LibraryDocumentChunk" ADD CONSTRAINT "LibraryDocumentChunk_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "LibraryDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
