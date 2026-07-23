import { z } from "zod";

import {
  CommandIdSchema,
  MatchIdSchema,
  MessageIdSchema,
  ProtocolVersionSchema,
  RevisionSchema,
  TimestampSchema
} from "./primitives.js";

export const CommandTypeSchema = z.enum([
  "match.create",
  "match.load",
  "match.scoreSet",
  "match.periodSet",
  "clock.start",
  "clock.pause",
  "clock.stop",
  "clock.correct",
  "clock.addedTimeSet",
  "graphics.previewSet",
  "graphics.cueTake",
  "graphics.cueHide",
  "graphics.allHide",
  "state.snapshotRequest"
]);

export const ServerEventTypeSchema = z.enum([
  "state.snapshot",
  "match.stateChanged",
  "clock.synchronized",
  "graphics.programChanged",
  "command.rejected",
  "connection.statusChanged"
]);

export const ErrorCodeSchema = z.enum([
  "INVALID_PAYLOAD",
  "UNSUPPORTED_PROTOCOL",
  "REVISION_CONFLICT",
  "DUPLICATE_COMMAND",
  "INVALID_TRANSITION",
  "INCOMPLETE_CUE",
  "PRODUCTION_LEASE_REQUIRED",
  "PERSISTENCE_FAILED",
  "MATCH_NOT_FOUND",
  "VMIX_UNAVAILABLE"
]);

const EnvelopeBaseSchema = z.object({
  protocolVersion: ProtocolVersionSchema,
  messageId: MessageIdSchema,
  sentAt: TimestampSchema
});

export const CommandPayloadSchema = z
  .object({
    commandId: CommandIdSchema,
    matchId: MatchIdSchema.optional(),
    expectedRevision: RevisionSchema.optional()
  })
  .catchall(z.unknown());

export const CommandEnvelopeSchema = EnvelopeBaseSchema.extend({
  type: CommandTypeSchema,
  payload: CommandPayloadSchema
}).strict();

export const ServerEventEnvelopeSchema = EnvelopeBaseSchema.extend({
  type: ServerEventTypeSchema,
  payload: z.record(z.string(), z.unknown())
}).strict();

export const AcceptedAcknowledgementSchema = z
  .object({
    accepted: z.literal(true),
    commandId: CommandIdSchema,
    resultingRevision: RevisionSchema
  })
  .strict();

export const RejectedAcknowledgementSchema = z
  .object({
    accepted: z.literal(false),
    commandId: CommandIdSchema,
    errorCode: ErrorCodeSchema,
    message: z.string().trim().min(1).max(240),
    currentRevision: RevisionSchema.nullable()
  })
  .strict();

export const CommandAcknowledgementSchema = z.discriminatedUnion("accepted", [
  AcceptedAcknowledgementSchema,
  RejectedAcknowledgementSchema
]);

export const ProtocolErrorSchema = z
  .object({
    errorCode: ErrorCodeSchema,
    message: z.string().trim().min(1).max(240),
    messageId: MessageIdSchema.optional()
  })
  .strict();

export type CommandType = z.infer<typeof CommandTypeSchema>;
export type ServerEventType = z.infer<typeof ServerEventTypeSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type CommandEnvelope = z.infer<typeof CommandEnvelopeSchema>;
export type ServerEventEnvelope = z.infer<typeof ServerEventEnvelopeSchema>;
export type CommandAcknowledgement = z.infer<typeof CommandAcknowledgementSchema>;
export type ProtocolError = z.infer<typeof ProtocolErrorSchema>;
