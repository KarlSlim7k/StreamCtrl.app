import {
  CommandAcknowledgementSchema,
  StateSnapshotSchema,
  type CommandAcknowledgement,
  type StateSnapshot
} from "@streamctrl/contracts";
import { create, type StoreApi, type UseBoundStore } from "zustand";

export interface MatchStore {
  connected: boolean;
  snapshot: StateSnapshot | null;
  pendingCommandIds: ReadonlySet<string>;
  lastAcknowledgement: CommandAcknowledgement | null;
  setConnected(connected: boolean): void;
  applySnapshot(snapshot: unknown): void;
  beginCommand(commandId: string): void;
  acknowledge(acknowledgement: unknown): void;
  clear(): void;
}

export function createMatchStore(): UseBoundStore<StoreApi<MatchStore>> {
  return create<MatchStore>((set) => ({
    connected: false,
    snapshot: null,
    pendingCommandIds: new Set<string>(),
    lastAcknowledgement: null,
    setConnected: (connected) => set({ connected }),
    applySnapshot: (snapshot) => set({ snapshot: StateSnapshotSchema.parse(snapshot) }),
    beginCommand: (commandId) =>
      set((state) => ({
        pendingCommandIds: new Set([...state.pendingCommandIds, commandId])
      })),
    acknowledge: (input) => {
      const acknowledgement = CommandAcknowledgementSchema.parse(input);
      set((state) => {
        const pendingCommandIds = new Set(state.pendingCommandIds);
        pendingCommandIds.delete(acknowledgement.commandId);
        return { pendingCommandIds, lastAcknowledgement: acknowledgement };
      });
    },
    clear: () =>
      set({
        connected: false,
        snapshot: null,
        pendingCommandIds: new Set<string>(),
        lastAcknowledgement: null
      })
  }));
}

export const useMatchStore = createMatchStore();
