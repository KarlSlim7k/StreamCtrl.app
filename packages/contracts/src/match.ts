import { z } from "zod";

import {
  HexColorSchema,
  MatchIdSchema,
  RevisionSchema,
  TeamIdSchema,
  TimestampSchema
} from "./primitives.js";

export const MatchStatusSchema = z.enum(["setup", "ready", "live", "paused", "finished"]);

export const PeriodSchema = z.enum([
  "preMatch",
  "firstHalf",
  "halfTime",
  "secondHalf",
  "extraTimeFirst",
  "extraTimeBreak",
  "extraTimeSecond",
  "penalties",
  "fullTime"
]);

export const ClockModeSchema = z.enum(["stopped", "running", "paused"]);

export const MatchFormatSchema = z
  .object({
    regulationPeriods: z.number().int().min(1).max(4).default(2),
    regulationMinutes: z.number().int().min(1).max(180).default(45),
    extraTimeEnabled: z.boolean().default(true),
    extraTimePeriods: z.number().int().min(0).max(4).default(2),
    extraTimeMinutes: z.number().int().min(0).max(60).default(15),
    penaltiesEnabled: z.boolean().default(true)
  })
  .strict()
  .superRefine((format, context) => {
    if (
      !format.extraTimeEnabled &&
      (format.extraTimePeriods !== 0 || format.extraTimeMinutes !== 0)
    ) {
      context.addIssue({
        code: "custom",
        message: "Disabled extra time must use zero periods and zero minutes"
      });
    }
  });

export const MatchClockSchema = z
  .object({
    mode: ClockModeSchema,
    accumulatedMs: z.number().int().nonnegative(),
    startedAtMonotonicMs: z.number().nonnegative().nullable(),
    displayOffsetMs: z.number().int(),
    addedTimeMinutes: z.number().int().nonnegative(),
    lastSyncedAt: TimestampSchema
  })
  .strict()
  .superRefine((clock, context) => {
    const hasAnchor = clock.startedAtMonotonicMs !== null;
    if ((clock.mode === "running") !== hasAnchor) {
      context.addIssue({
        code: "custom",
        path: ["startedAtMonotonicMs"],
        message: "Only a running clock may have a monotonic start anchor"
      });
    }
  });

export const TeamSchema = z
  .object({
    id: TeamIdSchema,
    fullName: z.string().trim().min(1).max(80),
    shortName: z.string().trim().min(1).max(12),
    primaryColor: HexColorSchema,
    secondaryColor: HexColorSchema,
    score: z.number().int().nonnegative(),
    penaltyScore: z.number().int().nonnegative()
  })
  .strict();

export const MatchSchema = z
  .object({
    id: MatchIdSchema,
    name: z.string().trim().min(1).max(120),
    status: MatchStatusSchema,
    homeTeamId: TeamIdSchema,
    awayTeamId: TeamIdSchema,
    currentPeriod: PeriodSchema,
    format: MatchFormatSchema,
    clock: MatchClockSchema,
    revision: RevisionSchema,
    createdAt: TimestampSchema,
    updatedAt: TimestampSchema
  })
  .strict()
  .superRefine((match, context) => {
    if (match.homeTeamId === match.awayTeamId) {
      context.addIssue({
        code: "custom",
        path: ["awayTeamId"],
        message: "Home and away teams must be distinct"
      });
    }
  });

export type MatchStatus = z.infer<typeof MatchStatusSchema>;
export type Period = z.infer<typeof PeriodSchema>;
export type ClockMode = z.infer<typeof ClockModeSchema>;
export type MatchFormat = z.infer<typeof MatchFormatSchema>;
export type MatchClock = z.infer<typeof MatchClockSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type Match = z.infer<typeof MatchSchema>;
