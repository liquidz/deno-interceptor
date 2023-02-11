export type Stage = "enter" | "leave";

export class NotDirectedAcyclicGraphError extends Error {
  constructor(vertexes: Set<string>) {
    super(
      `Not a directed acyclic graph at [${Array.from(vertexes).join(", ")}].`,
    );
  }
}

export class ExecutionError<T> extends Error {
  readonly stage: Stage;
  readonly interceptor: Interceptor<T> | undefined;
  constructor(
    { error, stage, interceptor }: {
      error: Error;
      stage: Stage;
      interceptor?: Interceptor<T>;
    },
  ) {
    super(error.message);
    this.name = error.name;
    this.stack = error.stack;

    this.stage = stage;
    this.interceptor = interceptor;
  }
}

export type Context<T> = {
  queue: Interceptor<T>[];
  stack: Interceptor<T>[];
  arg: T;
  error?: ExecutionError<T>;
};

export interface Interceptor<T> {
  name: string;
  requires?: string[];
  requireOthers?: boolean;
  enter?: (ctx: Context<T>) => Promise<Context<T>>;
  leave?: (ctx: Context<T>) => Promise<Context<T>>;
  error?: (ctx: Context<T>, e: ExecutionError<T>) => Promise<Context<T>>;
}
