#!/usr/bin/env node
// linkring — a tiny CLI that manages a personal bookmarks file.
// Invariant: zero runtime dependencies. Arg parsing is hand-rolled.

const USAGE = `linkring — personal bookmarks

Usage:
  linkring add <url> [--tags a,b] [--json]
  linkring list [--tag x] [--json]
  linkring search <text> [--json]
  linkring rm <id> [--json]
`;

export function main(argv: string[]): number {
  const [command] = argv;
  switch (command) {
    case undefined:
    case "help":
    case "--help":
    case "-h":
      process.stdout.write(USAGE);
      return command === undefined ? 1 : 0;
    case "add":
    case "list":
    case "search":
    case "rm":
      process.stderr.write(`linkring: '${command}' is not implemented yet\n`);
      return 1;
    default:
      process.stderr.write(`linkring: unknown command '${command}'\n${USAGE}`);
      return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main(process.argv.slice(2));
}
