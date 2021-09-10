export type Handler<T> = (req: T) => Promise<T | Error>;

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

export interface Context<T> {
  queue: Queue<T>;
  request: T;
  response?: T;
  error?: ExecutionError<T>;
}

export interface Interceptor<T> {
  name: string;
  requires?: string[];
  enter?: (ctx: Context<T>) => Promise<Context<T>>;
  leave?: (ctx: Context<T>) => Promise<Context<T>>;
  error?: (ctx: Context<T>, e: ExecutionError<T>) => Promise<Context<T>>;
}

export type Queue<T> = Interceptor<T>[];

export type Stage = "enter" | "leave" | "handler";
