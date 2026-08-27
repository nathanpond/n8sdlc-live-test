// `linkring rm <id> [--json]` (story #11).
// Ids are never reused after removal: the envelope's nextId counter (set by
// add) is monotonic and rm never lowers it — deleting the highest id then
// adding assigns a fresh id. See src/storage.ts header.
import { UsageError, type ParsedCommand } from "../args.js";
import { CommandError } from "./add.js";
import { renderJson, renderTable } from "../output.js";
import { loadStore, nextIdOf, saveStore } from "../storage.js";

export function rm(parsed: ParsedCommand): string {
  const [raw, ...extra] = parsed.positionals;
  if (raw === undefined) throw new UsageError("rm requires an <id> argument");
  if (extra.length > 0) throw new UsageError(`unexpected argument '${extra[0]}'`);
  if (!/^[1-9][0-9]*$/.test(raw)) {
    throw new UsageError(`'${raw}' is not a bookmark id (ids are positive integers)`);
  }
  const id = Number(raw);

  const store = loadStore();
  const index = store.bookmarks.findIndex((b) => b.id === id);
  if (index === -1) throw new CommandError(`no bookmark with id ${id}`);

  const [removed] = store.bookmarks.splice(index, 1);
  // Pin the counter so the removed id can never come back (invariant of #11).
  store.nextId = nextIdOf(store) > id ? nextIdOf(store) : id + 1;
  saveStore(store);

  return parsed.flags.json ? renderJson(removed) : renderTable([removed]);
}
