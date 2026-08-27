// `linkring list [--tag x] [--json]` (story #9).
import { UsageError, type ParsedCommand } from "../args.js";
import { renderJson, renderTable } from "../output.js";
import { loadStore } from "../storage.js";

export function list(parsed: ParsedCommand): string {
  if (parsed.positionals.length > 0) {
    throw new UsageError(`unexpected argument '${parsed.positionals[0]}'`);
  }
  if (parsed.flags.tags !== undefined) {
    throw new UsageError("--tags is not a list flag (did you mean --tag?)");
  }

  const tag = parsed.flags.tag?.toLowerCase();
  const rows = loadStore()
    .bookmarks.filter((b) => tag === undefined || b.tags.some((t) => t.toLowerCase() === tag))
    .sort((a, b) => a.id - b.id);

  if (parsed.flags.json) return renderJson(rows);
  if (rows.length === 0) {
    return tag === undefined ? "no bookmarks yet\n" : `no bookmarks tagged '${parsed.flags.tag}'\n`;
  }
  return renderTable(rows);
}
