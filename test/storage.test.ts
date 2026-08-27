// Subtask #8 done-when: storage unit-tested independent of any command.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadStore, nextIdOf, saveStore, StorageError, type Store } from "../src/storage.js";
import { useTempStore } from "./helpers.js";

const store = useTempStore();

describe("loadStore", () => {
  it("returns an empty version-1 store when the file is missing", () => {
    expect(loadStore()).toEqual({ version: 1, bookmarks: [] });
  });

  it("throws StorageError on unparseable JSON", () => {
    writeFileSync(store.path(), "{ not json", "utf8");
    expect(() => loadStore()).toThrow(StorageError);
  });

  it("throws StorageError on a JSON file that is not a store", () => {
    writeFileSync(store.path(), JSON.stringify({ hello: "world" }), "utf8");
    expect(() => loadStore()).toThrow(StorageError);
  });

  it("throws StorageError with a clear message on a newer format version", () => {
    writeFileSync(store.path(), JSON.stringify({ version: 99, bookmarks: [] }), "utf8");
    expect(() => loadStore()).toThrow(/newer linkring/);
  });
});

describe("saveStore", () => {
  it("round-trips and leaves no temp file behind (atomic write)", () => {
    const s: Store = {
      version: 1,
      bookmarks: [{ id: 1, url: "https://x.example/", tags: ["a"], added: "2026-08-27T00:00:00.000Z" }],
      nextId: 2,
    };
    saveStore(s);
    expect(loadStore()).toEqual(s);
    const dir = store.path().slice(0, store.path().lastIndexOf("/"));
    expect(readdirSync(dir)).toEqual(["store.json"]);
    expect(readFileSync(store.path(), "utf8")).toContain('"version": 1');
  });
});

describe("nextIdOf", () => {
  it("uses the nextId counter when present", () => {
    expect(nextIdOf({ version: 1, bookmarks: [], nextId: 7 })).toBe(7);
  });

  it("falls back to max id + 1 for pre-counter files", () => {
    const bm = (id: number) => ({ id, url: `https://${id}.example/`, tags: [], added: "2026-08-27T00:00:00.000Z" });
    expect(nextIdOf({ version: 1, bookmarks: [bm(3), bm(1)] })).toBe(4);
  });

  it("starts at 1 on an empty store", () => {
    expect(nextIdOf({ version: 1, bookmarks: [] })).toBe(1);
  });
});

// Audit regressions (M2): findings #17 and #18 — each evidence case from the
// issue becomes a permanent test.
describe("loadStore deep validation (audit #17)", () => {
  it("throws StorageError on a version-1 file with a malformed bookmark entry", () => {
    writeFileSync(store.path(), '{"version":1,"bookmarks":[{"id":1}]}', "utf8");
    expect(() => loadStore()).toThrow(StorageError);
  });

  it("throws StorageError when nextId is not greater than the max id (duplicate-id guard)", () => {
    writeFileSync(
      store.path(),
      JSON.stringify({
        version: 1,
        bookmarks: [{ id: 5, url: "https://a.example/", tags: [], added: "2026-08-27T00:00:00.000Z" }],
        nextId: 5,
      }),
      "utf8",
    );
    expect(() => loadStore()).toThrow(StorageError);
  });

  it("throws StorageError on duplicate ids", () => {
    const bm = { url: "https://a.example/", tags: [], added: "2026-08-27T00:00:00.000Z" };
    writeFileSync(
      store.path(),
      JSON.stringify({ version: 1, bookmarks: [{ id: 2, ...bm }, { id: 2, ...bm }] }),
      "utf8",
    );
    expect(() => loadStore()).toThrow(StorageError);
  });

  it("still loads a valid pre-counter file (no nextId) untouched", () => {
    const s = {
      version: 1,
      bookmarks: [{ id: 3, url: "https://a.example/", tags: ["x"], added: "2026-08-27T00:00:00.000Z" }],
    };
    writeFileSync(store.path(), JSON.stringify(s), "utf8");
    expect(loadStore()).toEqual(s);
  });
});

describe("saveStore error mapping (audit #18)", () => {
  it("throws StorageError, not a raw fs error, when the destination is unwritable", () => {
    process.env.LINKRING_FILE = "/nonexistent-dir/store.json";
    expect(() => saveStore({ version: 1, bookmarks: [] })).toThrow(StorageError);
    expect(() => saveStore({ version: 1, bookmarks: [] })).toThrow(/cannot write/);
  });
});
