import { describe, expect, it } from "vitest";
import { main } from "../src/cli.js";

describe("cli entry", () => {
  it("prints usage and exits 0 on help", () => {
    expect(main(["help"])).toBe(0);
  });

  it("exits 1 on unknown command", () => {
    expect(main(["frobnicate"])).toBe(1);
  });

  it("exits 1 with usage when no command given", () => {
    expect(main([])).toBe(1);
  });
});
