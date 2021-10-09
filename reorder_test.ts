import { asserts } from "./test_deps.ts";
import * as sut from "./reorder.ts";
import { Context, Interceptor } from "./types.ts";

Deno.test("reorder", () => {
  const interceptors: Array<Interceptor<number>> = [
    {
      name: "ccc",
      requires: ["aaa", "bbb"],
      enter: (c: Context<number>) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "bbb",
      requires: ["aaa"],
      enter: (c: Context<number>) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "aaa",
      enter: (c: Context<number>) => {
        return Promise.resolve(c);
      },
    },
  ];

  const res = sut.reorder(interceptors);
  asserts.assertEquals(res.map((i) => i.name), ["aaa", "bbb", "ccc"]);
});

Deno.test("emtpy", () => {
  const empty: Array<Interceptor<number>> = [];
  asserts.assertEquals(sut.reorder(empty), []);
});

Deno.test("no requires", () => {
  const interceptors: Array<Interceptor<number>> = [
    {
      name: "aaa",
      enter: (c: Context<number>) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "bbb",
      enter: (c: Context<number>) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "ccc",
      enter: (c: Context<number>) => {
        return Promise.resolve(c);
      },
    },
  ];
  const res = sut.reorder(interceptors);
  asserts.assertEquals(res.map((i) => i.name), ["aaa", "bbb", "ccc"]);
});

Deno.test("empty requires", () => {
  const interceptors: Array<Interceptor<number>> = [
    {
      name: "aaa",
      requires: [],
      enter: (c: Context<number>) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "bbb",
      requires: [],
      enter: (c: Context<number>) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "ccc",
      requires: [],
      enter: (c: Context<number>) => {
        return Promise.resolve(c);
      },
    },
  ];
  const res = sut.reorder(interceptors);
  asserts.assertEquals(res.map((i) => i.name), ["aaa", "bbb", "ccc"]);
});

Deno.test("require others", () => {
  const interceptors: Array<Interceptor<number>> = [
    {
      name: "ccc",
      requireOthers: true,
      enter: (c: Context<number>) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "bbb",
      requires: ["aaa"],
      enter: (c: Context<number>) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "aaa",
      enter: (c: Context<number>) => {
        return Promise.resolve(c);
      },
    },
  ];

  const res = sut.reorder(interceptors);
  asserts.assertEquals(res.map((i) => i.name), ["aaa", "bbb", "ccc"]);
});
