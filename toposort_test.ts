import { asserts } from "./test_deps.ts";
import { NotDirectedAcyclicGraphError } from "./types.ts";
import * as sut from "./toposort.ts";

function sset(...arr: Array<string>): Set<string> {
  return new Set<string>(arr);
}

Deno.test("sort", () => {
  const res = sut.sort({
    a: sset(),
    b: sset("a"),
    c: sset("a", "b"),
  });
  asserts.assertEquals(res, ["c", "b", "a"]);
});

Deno.test("sort: not a DAG", () => {
  try {
    sut.sort({
      a: sset("c"),
      b: sset("a"),
      c: sset("a", "b"),
    });
    asserts.assert(false);
  } catch (err) {
    asserts.assert(err instanceof NotDirectedAcyclicGraphError);
  }
});
