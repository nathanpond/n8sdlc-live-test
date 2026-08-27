// Guard for invariant 3 (story #12): the storage format is versioned JSON —
// never break reading an older file.
//
// One frozen sample per format version ever shipped lives in
// test/fixtures/storage/. Any future format change ADDS a fixture; editing or
// deleting one defeats the guard. Fixtures are discovered by globbing the
// directory, so v2.json later requires no edits here.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadStore, StorageError, type Store } from "../src/storage.js";
import { useTempStore } from "./helpers.js";

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "storage");
const fixtures = readdirSync(FIXTURE_DIR).filter((f) => f.endsWith(".json"));

const store = useTempStore();

describe("invariant 3: every shipped storage format still loads", () => {
  it("has at least the frozen v1 fixture", () => {
    expect(fixtures).toContain("v1.json");
  });

  it.each(fixtures)("%s round-trips through the production loadStore", (fixture) => {
    const raw = readFileSync(join(FIXTURE_DIR, fixture), "utf8");
    const expected = JSON.parse(raw) as Store;
    // Through the real reader via LINKRING_FILE — not a JSON.parse shortcut.
    writeFileSync(store.path(), raw, "utf8");
    const loaded = loadStore();
    expect(loaded.version).toBe(expected.version);
    expect(loaded.bookmarks).toHaveLength(expected.bookmarks.length);
    loaded.bookmarks.forEach((b, i) => {
      expect(b.id).toBe(expected.bookmarks[i].id);
      expect(b.url).toBe(expected.bookmarks[i].url);
      expect(b.tags).toEqual(expected.bookmarks[i].tags);
      expect(b.added).toBe(expected.bookmarks[i].added);
    });
  });

  it("rejects an unknown higher version with a clear typed error, no silent loss", () => {
    writeFileSync(store.path(), JSON.stringify({ version: 99, bookmarks: [] }), "utf8");
    expect(() => loadStore()).toThrow(StorageError);
    expect(() => loadStore()).toThrow(/newer linkring/);
  });
});
