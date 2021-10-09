import { asserts } from "./test_deps.ts";
import * as sut from "./execute.ts";
import { Context, ExecutionError } from "./types.ts";

type TestContext = Context<number>;

const plusInterceptor = {
  name: "plus",
  enter: (ctx: TestContext) => {
    ctx.arg += 1;
    return Promise.resolve(ctx);
  },
  leave: (ctx: TestContext) => {
    ctx.arg += 10;
    return Promise.resolve(ctx);
  },
};

const multiInterceptor = {
  name: "multi",
  enter: (ctx: TestContext) => {
    ctx.arg = ctx.arg * 2;
    return Promise.resolve(ctx);
  },
  leave: (ctx: TestContext) => {
    ctx.arg = ctx.arg * 20;
    return Promise.resolve(ctx);
  },
};

const failInterceptor = {
  name: "failure",
  enter: (_ctx: TestContext) => {
    throw Error("dummy error");
  },
};

const rejectInterceptor = {
  name: "failure",
  leave: (_ctx: TestContext) => {
    return Promise.reject(Error("dummy reject"));
  },
};

const terminateInterceptor = {
  name: "terminate",
  enter: (ctx: TestContext) => {
    ctx.arg = 10000;
    return Promise.resolve(sut.terminate(ctx));
  },
};

const errorHandlingInterceptor = {
  name: "error handling",
  leave: (_ctx: TestContext) => {
    throw Error("should not be called");
  },
  error: (ctx: TestContext, e: ExecutionError<number>) => {
    ctx.arg = (e.stage === "enter") ? e.message.length : -1;
    return Promise.resolve(ctx);
  },
};

Deno.test("execute", async () => {
  const res = await sut.execute<number>([
    plusInterceptor,
    multiInterceptor,
  ], 1).catch((err) => err);

  asserts.assert(!(res instanceof ExecutionError));
  asserts.assertEquals(res, 90);
});

Deno.test("execute error", async () => {
  const res = await sut.execute<number>([
    plusInterceptor,
    failInterceptor,
    multiInterceptor,
  ], 1).catch((err) => err);

  asserts.assert(res instanceof ExecutionError);
  asserts.assertEquals(res.stage, "enter");
  asserts.assertEquals(res.message, "dummy error");
  asserts.assertEquals(res.interceptor, failInterceptor);
});

Deno.test("execute terminate", async () => {
  const res = await sut.execute<number>([
    plusInterceptor,
    terminateInterceptor,
    multiInterceptor,
  ], 1).catch((err) => err);

  asserts.assert(!(res instanceof ExecutionError));
  asserts.assertEquals(res, 10010);
});

Deno.test("execute error handling function", async () => {
  const res = await sut.execute<number>([
    plusInterceptor,
    errorHandlingInterceptor,
    failInterceptor,
    multiInterceptor,
  ], 1).catch((err) => err);

  asserts.assert(!(res instanceof ExecutionError));
  // 'dummy error'.length + 10 = 21
  asserts.assertEquals(res, 21);
});

Deno.test("execute reject", async () => {
  const res = await sut.execute<number>([
    plusInterceptor,
    rejectInterceptor,
    multiInterceptor,
  ], 1).catch((err) => err);

  asserts.assert(res instanceof ExecutionError);
  asserts.assertEquals(res.stage, "leave");
  asserts.assertEquals(res.message, "dummy reject");
  asserts.assertEquals(res.interceptor, rejectInterceptor);
});
