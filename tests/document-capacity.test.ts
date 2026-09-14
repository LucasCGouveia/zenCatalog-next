import assert from "node:assert/strict";
import test from "node:test";
import {
  DOCUMENT_CHUNK_OVERLAP,
  DOCUMENT_CHUNK_SIZE,
  DOCUMENT_FILE_TOO_LARGE_MESSAGE,
  MAX_DOCUMENT_CHUNKS,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  MAX_DOCUMENT_FILE_SIZE_MB,
  MAX_DOCUMENT_REQUEST_SIZE_BYTES,
  MAX_EXTRACTED_CHARACTERS,
  isDocumentFileSizeAllowed,
} from "../src/biblioteca-documentos/constants";
import {
  extractDocumentText,
  splitDocumentIntoChunks,
} from "../src/biblioteca-documentos/services/documentService";
import { selectDocumentMatches } from "../src/chat/services/ragContext";
import type { DocumentMatch } from "../lib/vector";

const MB = 1024 * 1024;

test("document upload accepts the requested sizes and rejects files over 80 MB", () => {
  for (const sizeMb of [1, 9, 10, 25, 50, 79, 80]) {
    assert.equal(isDocumentFileSizeAllowed(sizeMb * MB), true, `${sizeMb} MB`);
  }

  assert.equal(isDocumentFileSizeAllowed(MAX_DOCUMENT_FILE_SIZE_BYTES + 1), false);
  assert.equal(MAX_DOCUMENT_FILE_SIZE_MB, 80);
  assert.equal(MAX_DOCUMENT_REQUEST_SIZE_BYTES, 100 * MB);
  assert.equal(
    DOCUMENT_FILE_TOO_LARGE_MESSAGE,
    "O arquivo excede o limite máximo de 80 MB.",
  );
});

test("text extraction keeps content after the former one-million-character limit", async () => {
  const laterContent = "CONTEUDO_LOCALIZADO_DEPOIS_DO_LIMITE_ANTIGO";
  const source = `${"a".repeat(1_200_000)}${laterContent}${"b".repeat(100)}`;
  const extracted = await extractDocumentText(Buffer.from(source), "text/plain");

  assert.ok(extracted.length > 1_000_000);
  assert.ok(extracted.includes(laterContent));
});

test("text extraction retains the 8M-character safety ceiling", async () => {
  const paragraph = "conteudo de teste. fim.\n\n";
  const source = paragraph.repeat(
    Math.ceil((MAX_EXTRACTED_CHARACTERS + 100) / paragraph.length),
  );
  const extracted = await extractDocumentText(Buffer.from(source), "text/plain");
  const chunks = splitDocumentIntoChunks(extracted);

  assert.equal(extracted.length, MAX_EXTRACTED_CHARACTERS);
  assert.ok(chunks.length > 800);
  for (const index of [0, 199, 499, 799]) {
    assert.ok(chunks[index].length > 0, `chunk ${index + 1}`);
  }
});

test("chunking covers hundreds of chunks while preserving size, overlap, and ceiling", () => {
  const stride = DOCUMENT_CHUNK_SIZE - DOCUMENT_CHUNK_OVERLAP;
  const paragraph = "conteudo de teste. fim.\n\n";
  const source = paragraph.repeat(
    Math.ceil((stride * 1_050) / paragraph.length),
  );
  const chunks = splitDocumentIntoChunks(source);

  assert.equal(DOCUMENT_CHUNK_SIZE, 9_000);
  assert.equal(DOCUMENT_CHUNK_OVERLAP, 900);
  assert.equal(MAX_DOCUMENT_CHUNKS, 1_000);
  assert.equal(chunks.length, MAX_DOCUMENT_CHUNKS);
  assert.ok(chunks.every((chunk) => chunk.length <= DOCUMENT_CHUNK_SIZE));
});

test("RAG selection still sends only a few relevant chunks to the prompt", () => {
  const indexedMatches: DocumentMatch[] = Array.from(
    { length: MAX_DOCUMENT_CHUNKS },
    (_, index) => ({
      id: `chunk-${index}`,
      documentId: `document-${index % 10}`,
      documentName: `Documento ${index % 10}`,
      fileType: "PDF",
      content: `Conteúdo do trecho ${index}`,
      similarity: 0.9,
    }),
  );

  const selected = selectDocumentMatches(indexedMatches);

  assert.equal(selected.length, 8);
  assert.ok(selected.length < indexedMatches.length);
});
