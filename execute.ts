import {
  Context,
  ExecutionError,
  Handler,
  Interceptor,
  Queue,
} from "./types.ts";

function setResult<T>(ctx: Context<T>, resp: T | Error): Context<T> {
  const newContext = ctx;
  if (resp instanceof Error) {
    newContext.error = new ExecutionError({
      stage: "handler",
      error: resp,
    });
  } else {
    newContext.response = resp;
  }
  return newContext;
}

function intoQueue<T>(coll: Array<Interceptor<T> | Handler<T>>): Queue<T> {
  return coll.map((v) => {
    if (typeof v === "function") {
      return {
        name: "__handler__",
        enter: async (ctx: Context<T>) => {
          return setResult(ctx, await v(ctx.request));
        },
      };
    } else {
      return v;
    }
  });
}

async function enter<T>(ctx: Context<T>): Promise<Context<T>> {
  let nextContext = ctx;
  for (const interceptor of ctx.queue) {
    if (nextContext.error != null) return nextContext;

    const enterFn = interceptor.enter;
    if (enterFn == null) continue;

    try {
      nextContext = await enterFn(nextContext);
    } catch (err) {
      const e = (err instanceof Error) ? err : Error(`Error ${err}`);
      nextContext.error = new ExecutionError({
        stage: "enter",
        interceptor: interceptor,
        error: e,
      });
    }
  }
  return nextContext;
}

async function leave<T>(ctx: Context<T>): Promise<Context<T>> {
  if (ctx.response == null) return ctx;

  let nextContext = ctx;
  for (const interceptor of ctx.queue.reverse()) {
    // Error handling with 'error' function
    if (nextContext.error != null) {
      const errorFn = interceptor.error;
      if (errorFn != null) {
        const e = nextContext.error;
        nextContext.error = undefined;
        nextContext = await errorFn(nextContext, e);
      }
      continue;
    }

    const leaveFn = interceptor.leave;
    if (leaveFn == null) continue;

    try {
      nextContext = await leaveFn(nextContext);
    } catch (err) {
      const e = (err instanceof Error) ? err : Error(`Error ${err}`);
      nextContext.error = new ExecutionError({
        stage: "leave",
        interceptor: interceptor,
        error: e,
      });
    }
  }
  return nextContext;
}

async function executeQueue<T>(queue: Queue<T>, params: T): Promise<T> {
  const ctx: Context<T> = {
    queue: queue,
    request: params,
  };
  const entered = await enter(ctx);
  const left = await leave(entered);

  if (left.error != null) {
    return Promise.reject(left.error);
  }
  if (left.response == null) {
    return Promise.reject(Error("no response"));
  }
  return left.response;
}

export function execute<T>(
  coll: Array<Interceptor<T> | Handler<T>>,
  params: T,
): Promise<T> {
  const queue = intoQueue(coll);
  return executeQueue(queue, params);
}
