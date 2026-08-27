// Shared renderers (subtask #8): every command routes output through these so
// `--json` behaves identically everywhere.
import type { Bookmark } from "./storage.js";

const HEADERS = ["ID", "URL", "TAGS", "ADDED"] as const;

/** Human-readable table: ID, URL, TAGS, ADDED — space-padded columns. */
export function renderTable(rows: Bookmark[]): string {
  const cells = rows.map((b) => [String(b.id), b.url, b.tags.join(","), b.added]);
  const widths = HEADERS.map((h, col) =>
    Math.max(h.length, ...cells.map((row) => row[col].length)),
  );
  const line = (row: readonly string[]) =>
    row.map((cell, col) => cell.padEnd(widths[col])).join("  ").trimEnd();
  return [line(HEADERS), ...cells.map(line)].join("\n") + "\n";
}

/** Machine output: pretty-printed JSON, nothing else. */
export function renderJson(value: unknown): string {
  return JSON.stringify(value, null, 2) + "\n";
}
