// Story #10 test plan.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Bookmark } from "../src/storage.js";
import { runCli, useTempStore } from "./helpers.js";

const store = useTempStore();

async function seed(): Promise<void> {
  await runCli(["add", "https://example.com/", "--tags", "dev"]);
  await runCli(["add", "https://news.site/", "--tags", "Reading"]);
}

describe("linkring search", () => {
  it("matches on URL substring, case-insensitively both ways", async () => {
    await seed();
    for (const term of ["EXAMPLE", "example"]) {
      const { code, out } = await runCli(["search", term, "--json"]);
      expect(code).toBe(0);
      expect((JSON.parse(out) as Bookmark[]).map((b) => b.id)).toEqual([1]);
    }
  });

  it("matches on tag substring, case-insensitively", async () => {
    await seed();
    const { out } = await runCli(["search", "read", "--json"]);
    expect((JSON.parse(out) as Bookmark[]).map((b) => b.id)).toEqual([2]);
  });

  it("renders matches as the standard table", async () => {
    await seed();
    const { code, out } = await runCli(["search", "example"]);
    expect(code).toBe(0);
    expect(out).toMatch(/ID\s+URL\s+TAGS\s+ADDED/);
    expect(out).toContain("https://example.com/");
  });

  it("no matches is a friendly one-liner, exit 0", async () => {
    await seed();
    const { code, out, err } = await runCli(["search", "zzz"]);
    expect(code).toBe(0);
    expect(out).toBe("no bookmarks matching 'zzz'\n");
    expect(err).toBe("");
  });

  it("missing search text is a usage error, exit 1", async () => {
    const { code, err } = await runCli(["search"]);
    expect(code).toBe(1);
    expect(err).toContain("search requires a <text> argument");
  });

  it("extra positionals are a usage error", async () => {
    const { code, err } = await runCli(["search", "two", "words"]);
    expect(code).toBe(1);
    expect(err).toContain("one term");
  });

  it("never modifies the storage file", async () => {
    await seed();
    const before = readFileSync(store.path(), "utf8");
    await runCli(["search", "example"]);
    await runCli(["search", "zzz", "--json"]);
    expect(readFileSync(store.path(), "utf8")).toBe(before);
  });
});
