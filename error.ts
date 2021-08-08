import { ExecutionError } from "./types.ts";

export function isExecutionError<T>(x: unknown): x is ExecutionError<T> {
  return typeof x === "object" && x != null &&
    typeof (x as ExecutionError<T>).stage === "string" &&
    (x as ExecutionError<T>).error instanceof Error;
}
