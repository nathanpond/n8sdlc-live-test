// Subtask #8 done-when: parseArgs unit-tested independent of any command.
import { describe, expect, it } from "vitest";
import { parseArgs, parseTags, UsageError } from "../src/args.js";

describe("parseArgs", () => {
  it("splits command, positionals, and flags", () => {
    expect(parseArgs(["add", "https://x.example/", "--tags", "a,b", "--json"])).toEqual({
      command: "add",
      positionals: ["https://x.example/"],
      flags: { tags: "a,b", json: true },
    });
  });

  it("supports --flag=value", () => {
    expect(parseArgs(["list", "--tag=dev"]).flags.tag).toBe("dev");
  });

  it("handles empty argv", () => {
    expect(parseArgs([])).toEqual({ command: undefined, positionals: [], flags: {} });
  });

  it("rejects unknown flags", () => {
    expect(() => parseArgs(["list", "--frobnicate"])).toThrow(UsageError);
  });

  it("rejects a value flag with no value", () => {
    expect(() => parseArgs(["list", "--tag"])).toThrow(UsageError);
    expect(() => parseArgs(["list", "--tag", "--json"])).toThrow(UsageError);
  });

  it("rejects a value handed to a boolean flag", () => {
    expect(() => parseArgs(["list", "--json=yes"])).toThrow(UsageError);
  });
});

describe("parseTags", () => {
  it.each([
    { raw: undefined, want: [] },
    { raw: "a", want: ["a"] },
    { raw: "a,b", want: ["a", "b"] },
    { raw: " a , b ", want: ["a", "b"] },
    { raw: ",,a,", want: ["a"] },
    { raw: "", want: [] },
  ])("$raw -> $want", ({ raw, want }) => {
    expect(parseTags(raw)).toEqual(want);
  });
});
