ALTER TABLE "Note" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

WITH ranked_notes AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "folderId" ORDER BY "createdAt" ASC) - 1 AS "nextPosition"
  FROM "Note"
)
UPDATE "Note"
SET "position" = ranked_notes."nextPosition"
FROM ranked_notes
WHERE "Note"."id" = ranked_notes."id";

CREATE INDEX "Note_folderId_position_idx" ON "Note"("folderId", "position");
