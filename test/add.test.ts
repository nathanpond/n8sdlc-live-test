// Story #6 test plan: add end to end via the real CLI entry.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Bookmark, Store } from "../src/storage.js";
import { runCli, useTempStore } from "./helpers.js";

const store = useTempStore();

function readStore(): Store {
  return JSON.parse(readFileSync(store.path(), "utf8")) as Store;
}

describe("linkring add", () => {
  it("creates the storage file with a version-1 envelope and a full bookmark", async () => {
    const { code, out } = await runCli(["add", "https://example.com/", "--tags", "dev,tools"]);
    expect(code).toBe(0);
    const s = readStore();
    expect(s.version).toBe(1);
    expect(s.bookmarks).toHaveLength(1);
    const b = s.bookmarks[0];
    expect(b.id).toBe(1);
    expect(b.url).toBe("https://example.com/");
    expect(b.tags).toEqual(["dev", "tools"]);
    expect(new Date(b.added).toISOString()).toBe(b.added); // ISO-8601 UTC
    expect(out).toContain("https://example.com/");
    expect(out).toMatch(/ID\s+URL\s+TAGS\s+ADDED/);
  });

  it("appends with id 2 on a second add", async () => {
    await runCli(["add", "https://one.example/"]);
    const { code } = await runCli(["add", "https://two.example/"]);
    expect(code).toBe(0);
    expect(readStore().bookmarks.map((b) => b.id)).toEqual([1, 2]);
  });

  describe("tags parsing", () => {
    it.each([
      { argv: ["add", "https://a.example/"], want: [] },
      { argv: ["add", "https://a.example/", "--tags", "solo"], want: ["solo"] },
      { argv: ["add", "https://a.example/", "--tags", "a,b,c"], want: ["a", "b", "c"] },
      { argv: ["add", "https://a.example/", "--tags", " a , b "], want: ["a", "b"] },
      { argv: ["add", "https://a.example/", "--tags", "a,,b,"], want: ["a", "b"] },
    ])("argv $argv -> $want", async ({ argv, want }) => {
      expect((await runCli(argv)).code).toBe(0);
      expect(readStore().bookmarks[0].tags).toEqual(want);
    });
  });

  it("rejects a duplicate URL naming the existing id and leaves the file byte-identical", async () => {
    await runCli(["add", "https://example.com/"]);
    const before = readFileSync(store.path(), "utf8");
    const { code, err } = await runCli(["add", "https://example.com/"]);
    expect(code).toBe(1);
    expect(err).toContain("already bookmarked (id 1)");
    expect(readFileSync(store.path(), "utf8")).toBe(before);
  });

  it("rejects an invalid URL and creates no file", async () => {
    const { code, err } = await runCli(["add", "not-a-url"]);
    expect(code).toBe(1);
    expect(err).toContain("not a valid URL");
    expect(existsSync(store.path())).toBe(false);
  });

  it("--json prints the created bookmark, matching what was stored", async () => {
    const { code, out } = await runCli(["add", "https://example.com/", "--tags", "x", "--json"]);
    expect(code).toBe(0);
    const printed = JSON.parse(out) as Bookmark;
    expect(printed).toEqual(readStore().bookmarks[0]);
  });
});

// Audit regression (M2, finding #19): the crafted terminal-escape add from the
// issue is a permanent test — attack-as-test.
describe("control-character rejection (audit #19)", () => {
  const ESC = String.fromCharCode(27); // 0x1b
  const BEL = String.fromCharCode(7); // 0x07
  it("rejects a URL smuggling an OSC escape sequence and leaves no file behind", async () => {
    const { code, err } = await runCli(["add", `https://x.com/${ESC}]0;pwned${BEL}end`]);
    expect(code).toBe(1);
    expect(err).toContain("control characters");
    expect(existsSync(store.path())).toBe(false);
  });

  it("rejects tags containing control characters", async () => {
    const { code, err } = await runCli(["add", "https://x.com/", "--tags", `ok,${ESC}[2Jevil`]);
    expect(code).toBe(1);
    expect(err).toContain("control characters");
    expect(existsSync(store.path())).toBe(false);
  });
});
