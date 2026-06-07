import { formatDateTime } from "./formatDate";

const ts = new Date("2026-06-07T20:45:00Z").getTime();

describe("formatDateTime", () => {
  it("formats English with year/month/day and 2-digit time", () => {
    const out = formatDateTime(ts, "en");
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });

  it("formats Japanese", () => {
    const out = formatDateTime(ts, "ja");
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });

  it("formats Korean", () => {
    const out = formatDateTime(ts, "ko");
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/\d{1,2}:\d{2}/);
  });
});
