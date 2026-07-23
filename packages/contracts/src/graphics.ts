import { z } from "zod";

import { MatchSchema, TeamSchema } from "./match.js";
import {
  CueIdSchema,
  ProtocolVersionSchema,
  RevisionSchema,
  TimestampSchema
} from "./primitives.js";

export const CueTypeSchema = z.enum(["scorebug", "lowerThird", "allHide"]);
export const CueActionSchema = z.enum(["preview", "take", "hide"]);

export const LowerThirdPayloadSchema = z
  .object({
    primaryText: z.string().trim().min(1).max(120),
    secondaryText: z.string().trim().min(1).max(160)
  })
  .strict();

const cueBase = {
  cueId: CueIdSchema,
  layer: z.number().int().min(0).max(99),
  requestedAt: TimestampSchema
};

export const GraphicCueSchema = z.discriminatedUnion("type", [
  z
    .object({
      ...cueBase,
      type: z.literal("scorebug"),
      action: CueActionSchema,
      payload: z.object({}).strict()
    })
    .strict(),
  z
    .object({
      ...cueBase,
      type: z.literal("lowerThird"),
      action: CueActionSchema,
      payload: LowerThirdPayloadSchema
    })
    .strict(),
  z
    .object({
      ...cueBase,
      type: z.literal("allHide"),
      action: z.literal("hide"),
      payload: z.object({}).strict()
    })
    .strict()
]);

export const GraphicInstanceSchema = z
  .object({
    cueId: CueIdSchema,
    type: z.enum(["scorebug", "lowerThird"]),
    payload: z.record(z.string(), z.unknown()),
    shownAt: TimestampSchema
  })
  .strict();

export const GraphicsStateSchema = z
  .object({
    programRevision: RevisionSchema,
    scorebug: GraphicInstanceSchema.nullable(),
    lowerThird: GraphicInstanceSchema.nullable(),
    updatedAt: TimestampSchema
  })
  .strict();

export const StateSnapshotSchema = z
  .object({
    protocolVersion: ProtocolVersionSchema,
    matchRevision: RevisionSchema,
    graphicsRevision: RevisionSchema,
    match: MatchSchema,
    teams: z.tuple([TeamSchema, TeamSchema]),
    graphics: GraphicsStateSchema,
    generatedAt: TimestampSchema
  })
  .strict()
  .superRefine((snapshot, context) => {
    const [firstTeam, secondTeam] = snapshot.teams;
    if (firstTeam.id === secondTeam.id) {
      context.addIssue({
        code: "custom",
        path: ["teams", 1, "id"],
        message: "Snapshot teams must be distinct"
      });
    }

    const teamIds = new Set(snapshot.teams.map((team) => team.id));
    if (!teamIds.has(snapshot.match.homeTeamId) || !teamIds.has(snapshot.match.awayTeamId)) {
      context.addIssue({
        code: "custom",
        path: ["teams"],
        message: "Snapshot teams must match the home and away team references"
      });
    }
  });

export type CueType = z.infer<typeof CueTypeSchema>;
export type CueAction = z.infer<typeof CueActionSchema>;
export type LowerThirdPayload = z.infer<typeof LowerThirdPayloadSchema>;
export type GraphicCue = z.infer<typeof GraphicCueSchema>;
export type GraphicInstance = z.infer<typeof GraphicInstanceSchema>;
export type GraphicsState = z.infer<typeof GraphicsStateSchema>;
export type StateSnapshot = z.infer<typeof StateSnapshotSchema>;
