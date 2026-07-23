export type RecoveryDecision = "apply" | "ignore" | "snapshot-required";

export class RecoveryCoordinator {
  evaluate(currentRevision: number | null, incomingRevision: number): RecoveryDecision {
    if (currentRevision === null) {
      return "snapshot-required";
    }
    if (incomingRevision <= currentRevision) {
      return "ignore";
    }
    return incomingRevision === currentRevision + 1 ? "apply" : "snapshot-required";
  }
}
