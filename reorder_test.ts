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

Deno.test("empty requires", () => {
  const dummyQueue: Queue<number> = [
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
  const res = sut.reorder(dummyQueue);
  asserts.assertEquals(res.map((i) => i.name), ["aaa", "bbb", "ccc"]);
});

Deno.test("require others", () => {
  const dummyQueue: Queue<number> = [
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

  const res = sut.reorder(dummyQueue);
  asserts.assertEquals(res.map((i) => i.name), ["aaa", "bbb", "ccc"]);
});

// class Foo implements Interceptor<number> {
//   name: string;
//   requires?: string[];
//
//   constructor(name: string, req: string[]) {
//     this.name = name;
//     this.requires = req;
//   }
// }
//
// console.log(
//   sut.reorder<Foo>([
//     new Foo("c", ["b"]),
//     new Foo("a", []),
//     new Foo("b", ["a"]),
//   ]),
// );
