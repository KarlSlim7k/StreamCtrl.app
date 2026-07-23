import { z } from "zod";

const opaqueId = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(128, `${label} must not exceed 128 characters`);

export const MatchIdSchema = opaqueId("matchId").brand<"MatchId">();
export const TeamIdSchema = opaqueId("teamId").brand<"TeamId">();
export const EventIdSchema = opaqueId("eventId").brand<"EventId">();
export const CommandIdSchema = opaqueId("commandId").brand<"CommandId">();
export const CueIdSchema = opaqueId("cueId").brand<"CueId">();
export const SessionIdSchema = opaqueId("sessionId").brand<"SessionId">();
export const MessageIdSchema = opaqueId("messageId").brand<"MessageId">();

export const RevisionSchema = z.number().int().nonnegative();
export const ProtocolVersionSchema = z.literal(1);
export const TimestampSchema = z.iso.datetime({ offset: true });
export const HexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i, "Expected an opaque hex color");

export type MatchId = z.infer<typeof MatchIdSchema>;
export type TeamId = z.infer<typeof TeamIdSchema>;
export type EventId = z.infer<typeof EventIdSchema>;
export type CommandId = z.infer<typeof CommandIdSchema>;
export type CueId = z.infer<typeof CueIdSchema>;
export type SessionId = z.infer<typeof SessionIdSchema>;
export type MessageId = z.infer<typeof MessageIdSchema>;
export type Revision = z.infer<typeof RevisionSchema>;
export type ProtocolVersion = z.infer<typeof ProtocolVersionSchema>;
export type Timestamp = z.infer<typeof TimestampSchema>;
