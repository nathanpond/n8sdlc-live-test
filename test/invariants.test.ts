// Guard for invariant 1: zero runtime dependencies (story #5).
// Reads the REAL package.json from the repo root — a copied fixture would
// guard nothing. Dev dependencies are unrestricted.
// peerDependencies are also held empty (Claude's Discretion on #5): a peer
// dependency on a CLI is a runtime install requirement in practice.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");

interface PackageJson {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

describe("invariant 1: zero runtime dependencies", () => {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as PackageJson;

  it("package.json declares no runtime dependencies", () => {
    expect(pkg.dependencies ?? {}).toEqual({});
  });

  it("package.json declares no peer dependencies", () => {
    expect(pkg.peerDependencies ?? {}).toEqual({});
  });
});
