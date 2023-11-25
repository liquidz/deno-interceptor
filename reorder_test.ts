import { asserts } from "./test_deps.ts";
import * as sut from "./reorder.ts";
import { Context, Interceptor } from "./types.ts";

Deno.test("reorder", () => {
  const interceptors: Interceptor[] = [
    {
      name: "ccc",
      depends: ["aaa", "bbb"],
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "bbb",
      depends: ["aaa"],
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "aaa",
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
  ];

  const res = sut.reorder(interceptors);
  asserts.assertEquals(res.map((i) => i.name), ["aaa", "bbb", "ccc"]);
});

Deno.test("emtpy", () => {
  const empty: Interceptor[] = [];
  asserts.assertEquals(sut.reorder(empty), []);
});

Deno.test("no dependencies", () => {
  const interceptors: Interceptor[] = [
    {
      name: "aaa",
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "bbb",
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "ccc",
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
  ];
  const res = sut.reorder(interceptors);
  asserts.assertEquals(res.map((i) => i.name), ["aaa", "bbb", "ccc"]);
});

Deno.test("empty dependencies", () => {
  const interceptors: Interceptor[] = [
    {
      name: "aaa",
      depends: [],
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "bbb",
      depends: [],
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "ccc",
      depends: [],
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
  ];
  const res = sut.reorder(interceptors);
  asserts.assertEquals(res.map((i) => i.name), ["aaa", "bbb", "ccc"]);
});

Deno.test("shoud be last", () => {
  const interceptors: Interceptor[] = [
    {
      name: "ccc",
      shouldBeLast: true,
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "bbb",
      depends: ["aaa"],
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "aaa",
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
  ];

  const res = sut.reorder(interceptors);
  asserts.assertEquals(res.map((i) => i.name), ["aaa", "bbb", "ccc"]);
});

Deno.test("multiple shoud be last", () => {
  const interceptors: Interceptor[] = [
    {
      name: "ccc",
      shouldBeLast: true,
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "bbb",
      shouldBeLast: true,
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
    {
      name: "aaa",
      enter: (c: Context) => {
        return Promise.resolve(c);
      },
    },
  ];

  asserts.assertThrows(
    () => sut.reorder(interceptors),
    "Not a directed acyclic graph",
  );
});
