import { Context, ExecutionError, Interceptor } from "./types.ts";

export function enqueue<T>(
  ctx: Context<T>,
  interceptor: Interceptor<T>,
): Context<T> {
  ctx.queue.push(interceptor);
  return ctx;
}

export function terminate<T>(ctx: Context<T>): Context<T> {
  ctx.queue = [];
  return ctx;
}

async function enter<T>(ctx: Context<T>): Promise<Context<T>> {
  const interceptor = ctx.queue.shift();
  if (interceptor == null) return ctx;
  ctx.stack.unshift(interceptor);

  const enterFn = interceptor.enter;
  if (enterFn == null) return ctx;

  try {
    return await enterFn.apply(interceptor, [ctx]);
  } catch (err) {
    const e = (err instanceof Error) ? err : Error(`Error ${err}`);
    ctx.error = new ExecutionError({
      stage: "enter",
      interceptor: interceptor,
      error: e,
    });
    return ctx;
  }
}

async function leave<T>(ctx: Context<T>): Promise<Context<T>> {
  const interceptor = ctx.stack.shift();
  if (interceptor == null) return ctx;

  if (ctx.error != null) {
    const errorFn = interceptor.error;
    if (errorFn == null) return ctx;
    const e = ctx.error;
    ctx.error = undefined;
    return await errorFn.apply(interceptor, [ctx, e]);
  }

  const leaveFn = interceptor.leave;
  if (leaveFn == null) return ctx;
  try {
    return await leaveFn.apply(interceptor, [ctx]);
  } catch (err) {
    const e = (err instanceof Error) ? err : Error(`Error ${err}`);
    ctx.error = new ExecutionError({
      stage: "leave",
      interceptor: interceptor,
      error: e,
    });
    return ctx;
  }
}

async function executeContext<T>(ctx: Context<T>): Promise<T> {
  let current = ctx;
  while (current.queue.length > 0) {
    current = await enter(current);
  }
  while (current.stack.length > 0) {
    current = await leave(current);
  }

  if (current.error != null) {
    return Promise.reject(current.error);
  }
  return current.arg;
}

export async function execute<T>(
  interceptors: Array<Interceptor<T>>,
  arg: T,
): Promise<T> {
  const ctx = {
    queue: interceptors,
    stack: [],
    arg: arg,
  };
  return await executeContext(ctx);
}
