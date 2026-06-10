import "dotenv/config";
import { Document, MongoClient, ObjectId } from "mongodb";
import { Client as PostgresClient } from "pg";

const sourceUrl = process.env.MONGODB_SOURCE_URL ?? process.env.DATABASE_URL;
const targetUrl = process.env.POSTGRES_TARGET_URL;

if (!sourceUrl?.startsWith("mongodb")) {
  throw new Error(
    "Defina MONGODB_SOURCE_URL ou mantenha a URL atual do MongoDB em DATABASE_URL.",
  );
}

if (!targetUrl?.startsWith("postgres")) {
  throw new Error(
    "Defina POSTGRES_TARGET_URL com a URL do PostgreSQL de destino.",
  );
}

type Table =
  | "User"
  | "Account"
  | "Session"
  | "Catalog"
  | "ChatSession"
  | "ChatMessage"
  | "Folder"
  | "Note";
type Row = Record<string, unknown>;

function id(value: unknown) {
  if (value instanceof ObjectId) return value.toHexString();
  if (typeof value === "string") return value;
  throw new Error(`ID invalido encontrado: ${String(value)}`);
}

function date(value: unknown, fallback = new Date()) {
  return value instanceof Date ? value : fallback;
}

function vector(value: unknown) {
  if (!Array.isArray(value) || value.length < 768) return null;

  const normalized = value.slice(0, 768);
  if (
    normalized.some(
      (item) => typeof item !== "number" || !Number.isFinite(item),
    )
  ) {
    return null;
  }

  return `[${normalized.join(",")}]`;
}

async function insert(pg: PostgresClient, table: Table, row: Row) {
  const columns = Object.keys(row);
  const values = Object.values(row);
  const identifiers = columns.map((column) => `"${column}"`).join(", ");
  const parameters = values.map((_, index) => `$${index + 1}`).join(", ");
  const vectorColumn = columns.indexOf("embedding");

  const sqlParameters =
    vectorColumn === -1
      ? parameters
      : values
          .map((_, index) =>
            index === vectorColumn ? `$${index + 1}::vector` : `$${index + 1}`,
          )
          .join(", ");

  await pg.query(
    `INSERT INTO "${table}" (${identifiers}) VALUES (${sqlParameters})`,
    values,
  );
}

async function main() {
  const mongo = new MongoClient(sourceUrl as string);
  const pg = new PostgresClient({ connectionString: targetUrl });
  const counts: Partial<Record<Table, number>> = {};
  const userIdMap = new Map<string, string>();

  await mongo.connect();
  await pg.connect();

  try {
    const mongoDb = mongo.db();
    const dependentTables: Table[] = [
      "Account",
      "Session",
      "Catalog",
      "ChatSession",
      "ChatMessage",
      "Folder",
      "Note",
    ];

    for (const table of dependentTables) {
      const result = await pg.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM "${table}"`,
      );
      if (Number(result.rows[0].count) > 0) {
        throw new Error(
          `O PostgreSQL de destino ja contem dados em ${table}. Use um banco vazio.`,
        );
      }
    }

    await pg.query("BEGIN");

    const existingUsers = await pg.query<{ id: string; email: string }>(
      'SELECT "id", "email" FROM "User"',
    );
    const existingUsersByEmail = new Map(
      existingUsers.rows.map((user) => [user.email, user.id]),
    );

    const users = await mongoDb.collection("User").find().toArray();
    for (const doc of users) {
      const sourceUserId = id(doc._id);
      const existingUserId = existingUsersByEmail.get(doc.email);
      const targetUserId = existingUserId ?? sourceUserId;
      userIdMap.set(sourceUserId, targetUserId);

      if (existingUserId) {
        await pg.query(
          `UPDATE "User"
           SET "emailVerified" = COALESCE("emailVerified", $1),
               "password" = COALESCE("password", $2),
               "name" = COALESCE("name", $3),
               "image" = COALESCE("image", $4),
               "systemPrompt" = COALESCE("systemPrompt", $5),
               "chatPrompt" = COALESCE("chatPrompt", $6)
           WHERE "id" = $7`,
          [
            doc.emailVerified ?? null,
            doc.password ?? null,
            doc.name ?? null,
            doc.image ?? null,
            doc.systemPrompt ?? null,
            doc.chatPrompt ?? null,
            existingUserId,
          ],
        );
      } else {
        await insert(pg, "User", {
          id: targetUserId,
          email: doc.email,
          emailVerified: doc.emailVerified ?? null,
          password: doc.password ?? null,
          name: doc.name ?? null,
          image: doc.image ?? null,
          systemPrompt: doc.systemPrompt ?? null,
          chatPrompt: doc.chatPrompt ?? null,
          createdAt: date(doc.createdAt),
          updatedAt: date(doc.updatedAt, date(doc.createdAt)),
        });
      }
    }
    counts.User = users.length;

    const targetUserId = (value: unknown) => {
      const sourceUserId = id(value);
      const mapped = userIdMap.get(sourceUserId);
      if (!mapped) {
        throw new Error(`Usuario de origem nao encontrado: ${sourceUserId}`);
      }
      return mapped;
    };

    const simpleCopies: Array<{
      table: Exclude<Table, "User" | "Catalog">;
      map: (doc: Document) => Row;
    }> = [
      {
        table: "Account",
        map: (doc) => ({
          id: id(doc._id),
          userId: targetUserId(doc.userId),
          type: doc.type,
          provider: doc.provider,
          providerAccountId: doc.providerAccountId,
          refresh_token: doc.refresh_token ?? null,
          access_token: doc.access_token ?? null,
          expires_at: doc.expires_at ?? null,
          token_type: doc.token_type ?? null,
          scope: doc.scope ?? null,
          id_token: doc.id_token ?? null,
          session_state: doc.session_state ?? null,
          refresh_token_expires_in: doc.refresh_token_expires_in ?? null,
        }),
      },
      {
        table: "Session",
        map: (doc) => ({
          id: id(doc._id),
          sessionToken: doc.sessionToken,
          userId: targetUserId(doc.userId),
          expires: date(doc.expires),
        }),
      },
      {
        table: "ChatSession",
        map: (doc) => ({
          id: id(doc._id),
          title: doc.title,
          isPinned: doc.isPinned ?? false,
          userId: targetUserId(doc.userId),
          createdAt: date(doc.createdAt),
          updatedAt: date(doc.updatedAt, date(doc.createdAt)),
        }),
      },
      {
        table: "ChatMessage",
        map: (doc) => ({
          id: id(doc._id),
          role: doc.role,
          content: doc.content,
          userId: targetUserId(doc.userId),
          sessionId: doc.sessionId ? id(doc.sessionId) : null,
          createdAt: date(doc.createdAt),
        }),
      },
      {
        table: "Folder",
        map: (doc) => ({
          id: id(doc._id),
          name: doc.name,
          userId: targetUserId(doc.userId),
          createdAt: date(doc.createdAt),
          updatedAt: date(doc.updatedAt, date(doc.createdAt)),
        }),
      },
      {
        table: "Note",
        map: (doc) => ({
          id: id(doc._id),
          title: doc.title,
          content: doc.content,
          folderId: id(doc.folderId),
          createdAt: date(doc.createdAt),
          updatedAt: date(doc.updatedAt, date(doc.createdAt)),
        }),
      },
    ];

    for (const { table, map } of simpleCopies.slice(0, 2)) {
      const documents = await mongoDb.collection(table).find().toArray();
      for (const doc of documents) await insert(pg, table, map(doc));
      counts[table] = documents.length;
    }

    const catalogs = await mongoDb.collection("Catalog").find().toArray();
    for (const doc of catalogs) {
      await insert(pg, "Catalog", {
        id: id(doc._id),
        fileName: doc.fileName,
        originalName: doc.originalName ?? null,
        summary: doc.summary,
        category: doc.category,
        subcategory: doc.subcategory ?? null,
        subject: doc.subject ?? null,
        author: doc.author ?? null,
        duration: doc.duration ?? null,
        isWatchEveryDay: doc.isWatchEveryDay ?? false,
        priority: doc.priority ?? null,
        observations: doc.observations ?? null,
        embedding: vector(doc.embedding),
        videoUrl: doc.videoUrl ?? null,
        sourceType: doc.sourceType ?? null,
        mimeType: doc.mimeType ?? null,
        thumbnailUrl: doc.thumbnailUrl ?? null,
        userId: targetUserId(doc.userId),
        createdAt: date(doc.createdAt),
        updatedAt: doc.updatedAt ? date(doc.updatedAt) : null,
      });
    }
    counts.Catalog = catalogs.length;

    for (const { table, map } of simpleCopies.slice(2)) {
      const documents = await mongoDb.collection(table).find().toArray();
      for (const doc of documents) await insert(pg, table, map(doc));
      counts[table] = documents.length;
    }

    await pg.query("COMMIT");
    console.table(counts);
    console.log("Migracao concluida. O MongoDB de origem nao foi alterado.");
  } catch (error) {
    await pg.query("ROLLBACK");
    throw error;
  } finally {
    await Promise.all([mongo.close(), pg.end()]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
