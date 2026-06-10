CREATE INDEX IF NOT EXISTS "Catalog_userId_idx"
    ON "Catalog"("userId");

CREATE INDEX IF NOT EXISTS "Catalog_embedding_hnsw_idx"
    ON "Catalog" USING hnsw ("embedding" vector_cosine_ops);
