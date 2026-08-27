// `linkring add <url> [--tags a,b] [--json]` (story #6).
import { parseTags, UsageError, type ParsedCommand } from "../args.js";
import { renderJson, renderTable } from "../output.js";
import { loadStore, nextIdOf, saveStore, type Bookmark } from "../storage.js";

/** User-facing command failure (duplicate URL, bad input); stderr + exit 1. */
export class CommandError extends Error {}

/** C0 controls (U+0000–U+001F) and DEL (U+007F) — code-point check, since
 * eslint's no-control-regex forbids the equivalent character class. */
function hasControlChars(s: string): boolean {
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (cp < 0x20 || cp === 0x7f) return true;
  }
  return false;
}

export function add(parsed: ParsedCommand): string {
  const [url, ...extra] = parsed.positionals;
  if (url === undefined) throw new UsageError("add requires a <url> argument");
  if (extra.length > 0) throw new UsageError(`unexpected argument '${extra[0]}'`);
  if (parsed.flags.tag !== undefined) throw new UsageError("--tag is not an add flag (did you mean --tags?)");

  // Validation happens before any store IO — bad input must leave the file untouched.
  try {
    new URL(url);
  } catch {
    throw new CommandError(`'${url}' is not a valid URL`);
  }
  // Terminal-escape hardening (audit finding #19): the raw input string is
  // what gets stored and later echoed by list/search, and `new URL()` accepts
  // C0 controls. Reject rather than canonicalize to .href — canonicalizing
  // would normalize (`https://x.com` → `https://x.com/`), contradicting the
  // documented no-normalization decision above.
  if (hasControlChars(url)) {
    throw new CommandError("URLs may not contain control characters");
  }
  const tags = parseTags(parsed.flags.tags);
  if (tags.some(hasControlChars)) {
    throw new CommandError("tags may not contain control characters");
  }

  const store = loadStore();
  // Duplicate check compares the exact stored string — no normalization
  // (delegated in #6's discretion; documented here: `https://x.com` and
  // `https://x.com/` are distinct on purpose — least surprise, zero magic).
  const existing = store.bookmarks.find((b) => b.url === url);
  if (existing) {
    throw new CommandError(`'${url}' is already bookmarked (id ${existing.id})`);
  }

  const bookmark: Bookmark = {
    id: nextIdOf(store),
    url,
    tags,
    added: new Date().toISOString(),
  };
  store.bookmarks.push(bookmark);
  store.nextId = bookmark.id + 1;
  saveStore(store);

  return parsed.flags.json ? renderJson(bookmark) : renderTable([bookmark]);
}
