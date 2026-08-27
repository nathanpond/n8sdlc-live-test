#!/usr/bin/env node
// linkring — a tiny CLI that manages a personal bookmarks file.
// Invariant: zero runtime dependencies. Arg parsing is hand-rolled.
//
// Thin dispatcher only (subtask #8): parse, route to a command function, map
// thrown errors to stderr + exit 1. Command modules never touch process/fs
// directly — storage goes through src/storage.ts, output through src/output.ts.
import { parseArgs, UsageError } from "./args.js";
import { add, CommandError } from "./commands/add.js";
import { StorageError } from "./storage.js";

const USAGE = `linkring — personal bookmarks

Usage:
  linkring add <url> [--tags a,b] [--json]
  linkring list [--tag x] [--json]
  linkring search <text> [--json]
  linkring rm <id> [--json]
`;

type Write = (s: string) => void;

export function main(
  argv: string[],
  out: Write = (s) => process.stdout.write(s),
  err: Write = (s) => process.stderr.write(s),
): number {
  try {
    const parsed = parseArgs(argv);
    switch (parsed.command) {
      case undefined:
        out(USAGE);
        return 1;
      case "help":
      case "--help":
      case "-h":
        out(USAGE);
        return 0;
      case "add":
        out(add(parsed));
        return 0;
      case "list":
      case "search":
      case "rm":
        err(`linkring: '${parsed.command}' is not implemented yet\n`);
        return 1;
      default:
        err(`linkring: unknown command '${parsed.command}'\n${USAGE}`);
        return 1;
    }
  } catch (e) {
    if (e instanceof UsageError) {
      err(`linkring: ${e.message}\n${USAGE}`);
      return 1;
    }
    if (e instanceof CommandError || e instanceof StorageError) {
      err(`linkring: ${e.message}\n`);
      return 1;
    }
    throw e; // real bugs crash loudly, they don't get a tidy exit code
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main(process.argv.slice(2));
}
