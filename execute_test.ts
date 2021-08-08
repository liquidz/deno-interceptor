import { asserts } from "./test_deps.ts";
import * as sut from "./execute.ts";
import { Context, ExecutionError } from "./types.ts";
import { isExecutionError } from "./error.ts";

type NumParam = Record<string, number>;

const dummyHandler = (req: NumParam) => {
  const num = req["x"] || 0;
  return { y: num + 5 };
};

Deno.test("execute", async () => {
  const firstInterceptor = {
    name: "first",
    enter: (ctx: Context<NumParam>) => {
      const num = ctx.request["x"] || 0;
      ctx.request["x"] = num + 1;
      return Promise.resolve(ctx);
    },
    leave: (ctx: Context<NumParam>) => {
      if (ctx.response == null) return Promise.resolve(ctx);
      const num = ctx.response["y"] || 0;
      ctx.response["y"] = num * 2;
      return Promise.resolve(ctx);
    },
  };

  const secondInterceptor = {
    name: "second",
    enter: (ctx: Context<NumParam>) => {
      const num = ctx.request["x"] || 0;
      ctx.request["x"] = num * 2;
      return Promise.resolve(ctx);
    },
    leave: (ctx: Context<NumParam>) => {
      if (ctx.response == null) return Promise.resolve(ctx);
      const num = ctx.response["y"] || 0;
      ctx.response["y"] = num - 1;
      return Promise.resolve(ctx);
    },
  };

  const res = await sut.execute<NumParam>([
    firstInterceptor,
    secondInterceptor,
    dummyHandler,
  ], { x: 10 });

  asserts.assert(!isExecutionError(res));
  asserts.assertEquals(res, { y: 52 });
});

Deno.test("error", async () => {
  const successInterceptor = {
    name: "success",
    enter: (ctx: Context<NumParam>) => {
      ctx.request["x"] = (ctx.request["x"] || 0) + 1;
      return Promise.resolve(ctx);
    },
  };

  const failureInterceptor = {
    name: "failure",
    enter: (_ctx: Context<NumParam>) => {
      throw Error("dummy error");
    },
  };

  const res = await sut.execute<NumParam>([
    successInterceptor,
    failureInterceptor,
  ], {
    x: 10,
  }).catch((err) => err);

  asserts.assert(isExecutionError(res));
  asserts.assertEquals(res.stage, "enter");
  asserts.assertEquals(res.interceptor, failureInterceptor);
  asserts.assertEquals(res.error.message, "dummy error");
});

Deno.test("interceptor error function", async () => {
  const failureInterceptor = {
    name: "failure",
    leave: (_ctx: Context<NumParam>) => {
      throw Error("message length is 20");
    },
  };

  const shouldBeSkippedInterceptor = {
    name: "should be skipped",
    leave: (ctx: Context<NumParam>) => {
      if (ctx.response == null) return Promise.resolve(ctx);
      ctx.response["must_not_be_executed"] = 1;
      return Promise.resolve(ctx);
    },
  };

  const errorHandlingInterceptor = {
    name: "error handling",
    leave: (ctx: Context<NumParam>) => {
      ctx.response = { must_not_be_executed: 2 };
      return Promise.resolve(ctx);
    },
    error: (ctx: Context<NumParam>, e: ExecutionError<NumParam>) => {
      if (ctx.response == null) return Promise.resolve(ctx);
      ctx.response["should_be_executed"] = (e.stage === "leave")
        ? e.error.message.length
        : -1;
      return Promise.resolve(ctx);
    },
  };

  const successInterceptor = {
    name: "success",
    leave: (ctx: Context<NumParam>) => {
      if (ctx.response == null) return Promise.resolve(ctx);
      ctx.response["should_be_executed"] =
        (ctx.response["should_be_executed"] || 0) * 2;
      return Promise.resolve(ctx);
    },
  };

  const res = await sut.execute<NumParam>([
    successInterceptor,
    errorHandlingInterceptor,
    shouldBeSkippedInterceptor,
    failureInterceptor,
    dummyHandler,
  ], { x: 10 });

  asserts.assert(!isExecutionError(res));
  asserts.assertEquals(res, { y: 15, should_be_executed: 40 });
});
