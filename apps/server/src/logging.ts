import { mkdirSync } from "node:fs";

import pino, { type DestinationStream, type Logger } from "pino";
import { createStream } from "rotating-file-stream";

export interface LoggerOptions {
  directory: string;
  level: pino.LevelWithSilent;
  service?: string;
  destination?: DestinationStream;
}

const redactionPaths = [
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "req.headers.authorization",
  "req.headers.cookie",
  "*.password",
  "*.token"
];

export function createLogger(options: LoggerOptions): Logger {
  const destination =
    options.destination ??
    (() => {
      mkdirSync(options.directory, { recursive: true });
      return createStream("streamctrl.log", {
        path: options.directory,
        size: "10M",
        interval: "1d",
        compress: "gzip",
        maxFiles: 7
      });
    })();

  return pino(
    {
      level: options.level,
      base: {
        service: options.service ?? "streamctrl-server"
      },
      redact: {
        paths: redactionPaths,
        censor: "[REDACTED]"
      },
      timestamp: pino.stdTimeFunctions.isoTime
    },
    destination
  );
}
