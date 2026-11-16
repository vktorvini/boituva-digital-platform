import { describe, it, expect } from "vitest";
import { getFinancialYearOptions } from "@/hooks/useFilterOptions";

describe("financial year filter options", () => {
  it("includes each year found in annual and calendar data, newest first", () => {
    expect(getFinancialYearOptions([2020, 2014, 2020], [2018, 2025, 2026])).toEqual([
      2026, 2025, 2020, 2018, 2014,
    ]);
  });

  it("falls back to the current year when no data is available", () => {
    expect(getFinancialYearOptions([], [], 2026)).toEqual([2026]);
  });
});
