export type ReportResult = { total: number; data: { label: string; value: number }[] };

export type ReportWithUnmatchingElements = ReportResult & { unspecified: number };
