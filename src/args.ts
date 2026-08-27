// Hand-rolled arg parsing (invariant 1: zero runtime deps).
// Pure function, no process access — fully unit-testable (subtask #8).
// Supports `--flag value`, `--flag=value`, and boolean flags (`--json`).

/** Typed error for bad invocations; the CLI maps it to usage + exit 1. */
export class UsageError extends Error {}

const VALUE_FLAGS = new Set(["tags", "tag"]);
const BOOLEAN_FLAGS = new Set(["json"]);

export interface ParsedCommand {
  command: string | undefined;
  positionals: string[];
  flags: {
    tags?: string;
    tag?: string;
    json?: boolean;
  };
}

export function parseArgs(argv: string[]): ParsedCommand {
  const [command, ...rest] = argv;
  const positionals: string[] = [];
  const flags: ParsedCommand["flags"] = {};

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    const name = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
    if (BOOLEAN_FLAGS.has(name)) {
      if (eq !== -1) throw new UsageError(`--${name} does not take a value`);
      flags[name as "json"] = true;
    } else if (VALUE_FLAGS.has(name)) {
      let value: string;
      if (eq !== -1) {
        value = arg.slice(eq + 1);
      } else {
        const next = rest[++i];
        if (next === undefined || next.startsWith("--")) {
          throw new UsageError(`--${name} requires a value`);
        }
        value = next;
      }
      flags[name as "tags" | "tag"] = value;
    } else {
      throw new UsageError(`unknown flag --${name}`);
    }
  }

  return { command, positionals, flags };
}

/** Comma-separated tags: trimmed, empty segments dropped. */
export function parseTags(raw: string | undefined): string[] {
  if (raw === undefined) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}
