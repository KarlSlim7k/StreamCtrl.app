import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const loopbackUrl = z.url().superRefine((value, context) => {
  const url = new URL(value);
  const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

  if (url.protocol !== "http:" || !loopbackHosts.has(url.hostname)) {
    context.addIssue({
      code: "custom",
      message: "vMix URL must use HTTP on a loopback host"
    });
  }
});

export const EnvironmentSchema = z
  .object({
    STREAMCTRL_HOST: z.literal("127.0.0.1").default("127.0.0.1"),
    STREAMCTRL_PORT: z.coerce.number().int().min(1).max(65_535).default(3100),
    STREAMCTRL_DATABASE_PATH: z.string().trim().min(1).default("data/streamctrl.db"),
    STREAMCTRL_LOG_DIRECTORY: z.string().trim().min(1).default("logs"),
    STREAMCTRL_LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    STREAMCTRL_VMIX_ENABLED: booleanFromString,
    STREAMCTRL_VMIX_BASE_URL: loopbackUrl.default("http://127.0.0.1:8088/api/")
  })
  .readonly();

export type StreamCtrlEnvironment = z.infer<typeof EnvironmentSchema>;

export function parseEnvironment(
  input: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): StreamCtrlEnvironment {
  return EnvironmentSchema.parse(input);
}
