export type HistoryKind =
  "create" | "score" | "clock" | "period" | "correction" | "restore" | "undo";

export interface HistoryEntry {
  id: string;
  kind: HistoryKind;
  before: unknown;
  after: unknown;
  revision: number;
  occurredAt: string;
  supersedesEventId?: string;
}

export function appendHistory(
  history: readonly HistoryEntry[],
  entry: HistoryEntry
): HistoryEntry[] {
  if (history.some((candidate) => candidate.id === entry.id)) {
    throw new Error(`History entry ${entry.id} already exists`);
  }
  return [...history, structuredClone(entry)];
}

export function undoLastHistoryEntry(
  history: readonly HistoryEntry[],
  undo: Pick<HistoryEntry, "id" | "revision" | "occurredAt">
): HistoryEntry[] {
  const target = [...history].reverse().find((entry) => entry.kind !== "undo");
  if (!target) {
    throw new Error("There is no history entry to undo");
  }

  return appendHistory(history, {
    ...undo,
    kind: "undo",
    before: structuredClone(target.after),
    after: structuredClone(target.before),
    supersedesEventId: target.id
  });
}
