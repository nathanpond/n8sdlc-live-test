// Versioned JSON storage for linkring (subtask #8 prescribes this module's shape).
//
// On-disk format (version 1):
//   { "version": 1, "bookmarks": [...], "nextId": <int, optional> }
//
// Id semantics (decided under #11's delegated discretion): ids are NEVER
// reused, even after deleting the highest id. The envelope carries an
// optional `nextId` counter; files written before it existed fall back to
// max(existing id) + 1. Optional field — still format version 1.
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface Bookmark {
  id: number;
  url: string;
  tags: string[];
  added: string; // ISO-8601 UTC
}

export interface Store {
  version: number;
  bookmarks: Bookmark[];
  nextId?: number;
}

export const CURRENT_VERSION = 1;

/** Typed error for storage problems; the CLI maps it to stderr + exit 1. */
export class StorageError extends Error {}

/** Resolved at call time, not module load — tests set LINKRING_FILE per test. */
export function storePath(): string {
  return process.env.LINKRING_FILE ?? join(homedir(), ".linkring.json");
}

export function loadStore(): Store {
  const path = storePath();
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: CURRENT_VERSION, bookmarks: [] };
    }
    throw new StorageError(`cannot read ${path}: ${String(err)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new StorageError(`${path} is not valid JSON — refusing to touch it`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new StorageError(`${path} does not look like a linkring store`);
  }
  const store = parsed as Partial<Store>;
  if (typeof store.version !== "number" || !Array.isArray(store.bookmarks)) {
    throw new StorageError(`${path} does not look like a linkring store`);
  }
  if (store.version > CURRENT_VERSION) {
    throw new StorageError(
      `${path} was written by a newer linkring (format version ${store.version}, ` +
        `this build reads up to ${CURRENT_VERSION}) — upgrade linkring instead of ` +
        `risking data loss`,
    );
  }
  // Deep validation (audit finding #17): a valid-JSON file with malformed
  // entries or a stale nextId must fail cleanly here, not crash a command
  // downstream or hand out duplicate ids. This narrows accepted *corrupt*
  // input only — every previously valid file still loads (invariant 3).
  const seen = new Set<number>();
  let maxId = 0;
  for (const entry of store.bookmarks) {
    if (!isBookmark(entry) || seen.has(entry.id)) {
      throw new StorageError(`${path} does not look like a linkring store`);
    }
    seen.add(entry.id);
    maxId = Math.max(maxId, entry.id);
  }
  if (store.nextId !== undefined) {
    if (!Number.isInteger(store.nextId) || store.nextId <= maxId) {
      throw new StorageError(`${path} does not look like a linkring store`);
    }
  }
  return store as Store;
}

function isBookmark(v: unknown): v is Bookmark {
  if (typeof v !== "object" || v === null) return false;
  const b = v as Partial<Bookmark>;
  return (
    typeof b.id === "number" &&
    Number.isInteger(b.id) &&
    b.id >= 1 &&
    typeof b.url === "string" &&
    Array.isArray(b.tags) &&
    b.tags.every((t) => typeof t === "string") &&
    typeof b.added === "string"
  );
}

/** The next id to assign; never reuses a previously assigned id (see header). */
export function nextIdOf(store: Store): number {
  if (typeof store.nextId === "number") return store.nextId;
  return store.bookmarks.reduce((max, b) => Math.max(max, b.id), 0) + 1;
}

/** Atomic write: temp file in the same directory, then rename. */
export function saveStore(store: Store): void {
  const path = storePath();
  const tmp = `${path}.tmp`;
  // Write failures are environmental (unwritable dir, bad LINKRING_FILE) and
  // owed the clean CLI error contract, mirroring loadStore's read-error
  // mapping (audit finding #18).
  try {
    writeFileSync(tmp, JSON.stringify(store, null, 2) + "\n", "utf8");
    renameSync(tmp, path);
  } catch (err) {
    throw new StorageError(`cannot write ${path}: ${String(err)}`);
  }
}
