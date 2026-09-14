export const MAX_DOCUMENT_FILE_SIZE_MB = 80;
export const MAX_DOCUMENT_FILE_SIZE_BYTES =
  MAX_DOCUMENT_FILE_SIZE_MB * 1024 * 1024;

// The multipart request is slightly larger than the file itself.
export const MAX_DOCUMENT_REQUEST_SIZE_MB = 100;
export const MAX_DOCUMENT_REQUEST_SIZE_BYTES =
  MAX_DOCUMENT_REQUEST_SIZE_MB * 1024 * 1024;

export const MAX_EXTRACTED_CHARACTERS = 8_000_000;
export const MAX_DOCUMENT_CHUNKS = 1_000;
export const DOCUMENT_CHUNK_SIZE = 9_000;
export const DOCUMENT_CHUNK_OVERLAP = 900;

export const DOCUMENT_FILE_TOO_LARGE_MESSAGE =
  `O arquivo excede o limite máximo de ${MAX_DOCUMENT_FILE_SIZE_MB} MB.`;
export const DOCUMENT_FILE_SIZE_HINT =
  `Máximo de ${MAX_DOCUMENT_FILE_SIZE_MB} MB.`;

export function isDocumentFileSizeAllowed(size: number) {
  return (
    Number.isFinite(size) &&
    size >= 0 &&
    size <= MAX_DOCUMENT_FILE_SIZE_BYTES
  );
}
