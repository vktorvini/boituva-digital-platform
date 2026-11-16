import { describe, expect, it } from "vitest";
import { getLatestYearData, municipiosRegiao } from "@/data/iegmData";

describe("IEGM overview year selection", () => {
  const boituva = municipiosRegiao.find((municipio) => municipio.isBoituva)!;

  it("uses the selected historical year instead of falling back to the latest score", () => {
    const result = getLatestYearData(boituva, 2020);

    expect(result.ano).toBe(2020);
    expect(result.iegm.faixa).toBe("C");
    expect(result.iegm.nota).toBe(4.5);
  });

  it("uses the most recent available year not later than the selected year", () => {
    expect(getLatestYearData(boituva, 2026).ano).toBe(2025);
    expect(getLatestYearData(boituva, 2014).ano).toBe(2015);
  });
});
