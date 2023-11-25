export type Stage = "enter" | "leave";

export class NotDirectedAcyclicGraphError extends Error {
  constructor(vertexes: Set<string>) {
    super(
      `Not a directed acyclic graph at [${Array.from(vertexes).join(", ")}].`,
    );
  }
}

export class ExecutionError<T = unknown, U = unknown> extends Error {
  readonly stage: Stage;
  readonly interceptor: Interceptor<T, U> | undefined;
  constructor(
    { error, stage, interceptor }: {
      error: Error;
      stage: Stage;
      interceptor?: Interceptor<T, U>;
    },
  ) {
    super(error.message);
    this.name = error.name;
    this.stack = error.stack;

    this.stage = stage;
    this.interceptor = interceptor;
  }
}

export type Context<T = unknown, U = unknown> = {
  request: T;
  response?: U;
  error?: ExecutionError<T, U>;

  _queue: Interceptor<T, U>[];
  _stack: Interceptor<T, U>[];
};

export interface Interceptor<T = unknown, U = unknown> {
  name: string;
  enter?: (ctx: Context<T, U>) => Promise<Context<T, U>>;
  leave?: (ctx: Context<T, U>) => Promise<Context<T, U>>;
  error?: (
    ctx: Context<T, U>,
    e: ExecutionError<T, U>,
  ) => Promise<Context<T, U>>;

  depends?: string[];
  shouldBeLast?: boolean;
}
