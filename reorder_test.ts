import { asserts } from "./test_deps.ts";
import * as sut from "./reorder.ts";
import { Context, Queue } from "./types.ts";

Deno.test("reorder", () => {
  const dummyQueue: Queue<number> = [
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

  const res = sut.reorder(dummyQueue);
  asserts.assertEquals(res.map((i) => i.name), ["aaa", "bbb", "ccc"]);
});

Deno.test("emtpy", () => {
  const empty: Queue<number> = [];
  asserts.assertEquals(sut.reorder(empty), []);
});

Deno.test("no requires", () => {
  const dummyQueue: Queue<number> = [
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
  const res = sut.reorder(dummyQueue);
  asserts.assertEquals(res.map((i) => i.name), ["aaa", "bbb", "ccc"]);
});
