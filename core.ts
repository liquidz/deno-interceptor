import { Context, ExecutionError, Interceptor } from "./types.ts";

async function enter<T = unknown, U = unknown>(
  context: Context<T, U>,
): Promise<Context<T, U>> {
  const interceptor = context._queue.shift();
  if (interceptor == null) {
    return context;
  }
  context._stack.unshift(interceptor);

  if (interceptor.enter == null) {
    return context;
  }

  try {
    return await interceptor.enter.apply(interceptor, [context]);
  } catch (error) {
    const e = error instanceof Error ? error : new Error(error);
    context.error = new ExecutionError({
      stage: "enter",
      interceptor: interceptor,
      error: e,
    });
    return context;
  }
}

async function leave<T = unknown, U = unknown>(
  context: Context<T, U>,
): Promise<Context<T, U>> {
  const interceptor = context._stack.shift();
  if (interceptor == null) {
    return context;
  }

  if (context.error != null) {
    if (interceptor.error == null) {
      return context;
    }
    const e = context.error;
    context.error = undefined;
    return await interceptor.error.apply(interceptor, [context, e]);
  }

  if (interceptor.leave == null) {
    return context;
  }

  try {
    return await interceptor.leave.apply(interceptor, [context]);
  } catch (error) {
    const e = error instanceof Error ? error : new Error(error);
    context.error = new ExecutionError({
      stage: "leave",
      interceptor: interceptor,
      error: e,
    });
    return context;
  }
}

async function executeContext<T = unknown, U = unknown>(
  context: Context<T, U>,
): Promise<U | unknown> {
  let currentContext = context;
  while (currentContext._queue.length > 0) {
    currentContext = await enter(currentContext);
  }

  while (currentContext._stack.length > 0) {
    currentContext = await leave(currentContext);
  }

  if (currentContext.error != null) {
    return Promise.reject(currentContext.error);
  }

  return currentContext.response;
}

export function enqueue<T = unknown, U = unknown>(
  context: Context<T, U>,
  interceptor: Interceptor<T, U>,
): Context<T, U> {
  context._queue.push(interceptor);
  return context;
}

export function terminate<T = unknown, U = unknown>(
  context: Context<T, U>,
): Context<T, U> {
  context._queue = [];
  return context;
}

export async function execute<T = unknown, U = unknown>(
  interceptors: Interceptor<T, U>[],
  request: T,
): Promise<U | unknown> {
  const context = {
    _queue: [...interceptors],
    _stack: [],
    request: request,
  };

  return await executeContext(context);
}
