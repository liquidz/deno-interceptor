import { asserts } from "./test_deps.ts";
import * as sut from "./core.ts";
import { Context, ExecutionError } from "./types.ts";

type TestContext = Context<number, number>;

const plusInterceptor = {
  name: "plus",
  enter: (context: TestContext) => {
    context.response = (context.response ?? context.request) + 1;

    return Promise.resolve(context);
  },
  leave: (context: TestContext) => {
    context.response = (context.response ?? 0) + 10;
    return Promise.resolve(context);
  },
};

const multiInterceptor = {
  name: "multi",
  enter: (context: TestContext) => {
    context.response = (context.response ?? context.request) * 2;
    return Promise.resolve(context);
  },
  leave: (context: TestContext) => {
    context.response = (context.response ?? 0) * 20;
    return Promise.resolve(context);
  },
};

const failInterceptor = {
  name: "failure",
  enter: (_context: TestContext) => {
    throw Error("dummy error");
  },
};

const rejectInterceptor = {
  name: "failure",
  leave: (_context: TestContext) => {
    return Promise.reject(Error("dummy reject"));
  },
};

const terminateInterceptor = {
  name: "terminate",
  enter: (context: TestContext) => {
    console.log("terminate enter");
    context.response = 10000;
    return Promise.resolve(sut.terminate(context));
  },
};

const errorHandlingInterceptor = {
  name: "error handling",
  leave: (_context: TestContext) => {
    throw Error("should not be called");
  },
  error: (context: TestContext, e: ExecutionError<number, number>) => {
    context.response = (e.stage === "enter") ? e.message.length : -1;
    return Promise.resolve(context);
  },
};

Deno.test("execute", async () => {
  const res = await sut.execute<number, number>([
    plusInterceptor,
    multiInterceptor,
  ], 1).catch((err) => err);

  asserts.assert(!(res instanceof ExecutionError));
  asserts.assertEquals(res, 90);
});

Deno.test("execute error", async () => {
  const res = await sut.execute<number, number>([
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
  const res = await sut.execute<number, number>([
    plusInterceptor,
    terminateInterceptor,
    multiInterceptor,
  ], 1).catch((err) => err);

  asserts.assert(!(res instanceof ExecutionError));
  asserts.assertEquals(res, 10010);
});

Deno.test("execute error handling function", async () => {
  const res = await sut.execute<number, number>([
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
  const res = await sut.execute<number, number>([
    plusInterceptor,
    rejectInterceptor,
    multiInterceptor,
  ], 1).catch((err) => err);

  asserts.assert(res instanceof ExecutionError);
  asserts.assertEquals(res.stage, "leave");
  asserts.assertEquals(res.message, "dummy reject");
  asserts.assertEquals(res.interceptor, rejectInterceptor);
});
