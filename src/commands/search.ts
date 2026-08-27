// `linkring search <text> [--json]` (story #10).
// Single search term is the contract (delegated call: extra positionals are a
// usage error, not silently joined — matches the "<text>" signature exactly).
import { UsageError, type ParsedCommand } from "../args.js";
import { renderJson, renderTable } from "../output.js";
import { loadStore } from "../storage.js";

export function search(parsed: ParsedCommand): string {
  const [text, ...extra] = parsed.positionals;
  if (text === undefined) throw new UsageError("search requires a <text> argument");
  if (extra.length > 0) {
    throw new UsageError(`search takes one term (unexpected '${extra[0]}' — quote multi-word searches)`);
  }

  const needle = text.toLowerCase();
  const rows = loadStore()
    .bookmarks.filter(
      (b) =>
        b.url.toLowerCase().includes(needle) ||
        b.tags.some((t) => t.toLowerCase().includes(needle)),
    )
    .sort((a, b) => a.id - b.id);

  if (parsed.flags.json) return renderJson(rows);
  if (rows.length === 0) return `no bookmarks matching '${text}'\n`;
  return renderTable(rows);
}
