// Shared test plumbing: every storage-touching test isolates through
// LINKRING_FILE pointing into a fresh temp dir (story #6 test plan).
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach } from "vitest";

export function useTempStore(): { path: () => string } {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "linkring-test-"));
    process.env.LINKRING_FILE = join(dir, "store.json");
  });
  afterEach(() => {
    delete process.env.LINKRING_FILE;
    rmSync(dir, { recursive: true, force: true });
  });
  return { path: () => process.env.LINKRING_FILE! };
}

/** Run main() capturing stdout/stderr. */
export async function runCli(argv: string[]): Promise<{ code: number; out: string; err: string }> {
  const { main } = await import("../src/cli.js");
  let out = "";
  let err = "";
  const code = main(
    argv,
    (s) => (out += s),
    (s) => (err += s),
  );
  return { code, out, err };
}
