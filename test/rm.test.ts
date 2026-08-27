// Story #11 test plan.
import { readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Bookmark, Store } from "../src/storage.js";
import { runCli, useTempStore } from "./helpers.js";

const store = useTempStore();

async function seed(): Promise<void> {
  await runCli(["add", "https://one.example/"]);
  await runCli(["add", "https://two.example/"]);
  await runCli(["add", "https://three.example/"]);
}

describe("linkring rm", () => {
  it("removes by id, confirms with the removed row, and persists", async () => {
    await seed();
    const { code, out } = await runCli(["rm", "2"]);
    expect(code).toBe(0);
    expect(out).toContain("https://two.example/");
    const { out: listed } = await runCli(["list", "--json"]);
    expect((JSON.parse(listed) as Bookmark[]).map((b) => b.id)).toEqual([1, 3]);
  });

  it("nonexistent id errors naming the id and leaves the file byte-identical", async () => {
    await seed();
    const before = readFileSync(store.path(), "utf8");
    const { code, err } = await runCli(["rm", "99"]);
    expect(code).toBe(1);
    expect(err).toContain("no bookmark with id 99");
    expect(readFileSync(store.path(), "utf8")).toBe(before);
  });

  it("non-numeric id is a usage error, exit 1", async () => {
    await seed();
    for (const bad of ["abc", "-1", "1.5", "0"]) {
      const { code, err } = await runCli(["rm", bad]);
      expect(code).toBe(1);
      expect(err).toContain("not a bookmark id");
    }
  });

  it("--json returns the removed object", async () => {
    await seed();
    const { out: before } = await runCli(["list", "--json"]);
    const target = (JSON.parse(before) as Bookmark[])[1];
    const { code, out } = await runCli(["rm", "2", "--json"]);
    expect(code).toBe(0);
    expect(JSON.parse(out)).toEqual(target);
  });

  it("never reuses an id: deleting the highest id then adding assigns a fresh one", async () => {
    await seed();
    await runCli(["rm", "3"]);
    await runCli(["add", "https://four.example/"]);
    const { out } = await runCli(["list", "--json"]);
    expect((JSON.parse(out) as Bookmark[]).map((b) => b.id)).toEqual([1, 2, 4]);
  });

  it("never reuses an id even on a legacy file without a nextId counter", async () => {
    const legacy: Store = {
      version: 1,
      bookmarks: [
        { id: 1, url: "https://a.example/", tags: [], added: "2026-01-01T00:00:00.000Z" },
        { id: 2, url: "https://b.example/", tags: [], added: "2026-01-01T00:00:00.000Z" },
      ],
    };
    writeFileSync(store.path(), JSON.stringify(legacy), "utf8");
    await runCli(["rm", "2"]);
    await runCli(["add", "https://c.example/"]);
    const { out } = await runCli(["list", "--json"]);
    expect((JSON.parse(out) as Bookmark[]).map((b) => b.id)).toEqual([1, 3]);
  });
});
