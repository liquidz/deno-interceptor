import { NotDirectedAcyclicGraphError } from "./types.ts";

export type GraphMap = Record<string, Set<string>>;

export function sort(graphMap: GraphMap): string[] {
  const tempMark = new Set<string>();
  const permMark = new Set<string>();
  const stack: string[] = [];

  for (const p of Object.keys(graphMap)) {
    if (tempMark.has(p) || permMark.has(p)) continue;
    visit(graphMap, p, tempMark, permMark, stack);
  }
  return stack;
}

function visit(
  graphMap: GraphMap,
  vertex: string,
  tempMark: Set<string>,
  permMark: Set<string>,
  stack: string[],
) {
  if (tempMark.has(vertex)) throw new NotDirectedAcyclicGraphError(tempMark);
  if (permMark.has(vertex)) return;

  tempMark.add(vertex);
  for (const c of graphMap[vertex] ?? []) {
    visit(graphMap, c, tempMark, permMark, stack);
  }

  permMark.add(vertex);
  tempMark.delete(vertex);
  stack.unshift(vertex);
}
