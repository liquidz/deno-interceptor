export type Handler<T> = (req: T) => Promise<T | Error>;

export type ExecutionError<T> = {
  stage: Stage;
  interceptor?: Interceptor<T>;
  error: Error;
};

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
