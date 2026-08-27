// Story #9 test plan.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Bookmark } from "../src/storage.js";
import { runCli, useTempStore } from "./helpers.js";

const store = useTempStore();

async function seed(): Promise<void> {
  await runCli(["add", "https://one.example/", "--tags", "Dev,tools"]);
  await runCli(["add", "https://two.example/", "--tags", "reading"]);
  await runCli(["add", "https://three.example/", "--tags", "dev"]);
}

describe("linkring list", () => {
  it("lists all bookmarks in a table, id ascending", async () => {
    await seed();
    const { code, out } = await runCli(["list"]);
    expect(code).toBe(0);
    const lines = out.trimEnd().split("\n");
    expect(lines[0]).toMatch(/ID\s+URL\s+TAGS\s+ADDED/);
    expect(lines.slice(1).map((l) => l.split(/\s+/)[0])).toEqual(["1", "2", "3"]);
  });

  it("--tag filters by exact case-insensitive tag membership", async () => {
    await seed();
    const { code, out } = await runCli(["list", "--tag", "dev", "--json"]);
    expect(code).toBe(0);
    expect((JSON.parse(out) as Bookmark[]).map((b) => b.id)).toEqual([1, 3]); // "Dev" matches too
  });

  it("--tag does not substring-match (dev must not match devops)", async () => {
    await runCli(["add", "https://ops.example/", "--tags", "devops"]);
    const { out } = await runCli(["list", "--tag", "dev", "--json"]);
    expect(JSON.parse(out)).toEqual([]);
  });

  it("empty store is a friendly one-liner, exit 0", async () => {
    const { code, out, err } = await runCli(["list"]);
    expect(code).toBe(0);
    expect(out).toBe("no bookmarks yet\n");
    expect(err).toBe("");
  });

  it("no matches for a tag is a friendly one-liner, exit 0", async () => {
    await seed();
    const { code, out } = await runCli(["list", "--tag", "nope"]);
    expect(code).toBe(0);
    expect(out).toBe("no bookmarks tagged 'nope'\n");
  });

  it("--json prints a JSON array, empty store included", async () => {
    const empty = await runCli(["list", "--json"]);
    expect(empty.code).toBe(0);
    expect(JSON.parse(empty.out)).toEqual([]);
    await seed();
    const { out } = await runCli(["list", "--json"]);
    expect((JSON.parse(out) as Bookmark[]).length).toBe(3);
  });

  it("never modifies the storage file", async () => {
    await seed();
    const before = readFileSync(store.path(), "utf8");
    await runCli(["list"]);
    await runCli(["list", "--tag", "dev"]);
    await runCli(["list", "--json"]);
    expect(readFileSync(store.path(), "utf8")).toBe(before);
  });
});
