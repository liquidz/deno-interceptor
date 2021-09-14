import { Interceptor } from "./types.ts";
import { KahnGraph } from "./deps.ts";

//deno-lint-ignore no-explicit-any
export function reorder<T extends Interceptor<any>>(
  interceptors: Array<T>,
): Array<T> {
  const idToInterceptor: Record<string, T> = {};
  for (let i = 0; i < interceptors.length; ++i) {
    idToInterceptor[i.toString()] = interceptors[i];
  }

  const nameToId: Record<string, string> = {};
  for (const id in idToInterceptor) {
    nameToId[idToInterceptor[id].name] = id;
  }

  const graph = new KahnGraph();
  for (const id in idToInterceptor) {
    const interceptor = idToInterceptor[id];

    if (interceptor.requireOthers) {
      for (const i of interceptors) {
        const fromId = nameToId[i.name];
        if (fromId == null || fromId === id) continue;
        graph.addEdge({ id: fromId }, { id: id });
      }
    } else if (
      interceptor.requires != null && interceptor.requires.length > 0
    ) {
      for (const name of interceptor.requires) {
        const fromId = nameToId[name];
        if (fromId == null) continue;
        graph.addEdge({ id: fromId }, { id: id });
      }
    } else {
      graph.addNode({ id: id });
    }
  }

  return graph.sort().map((v) => idToInterceptor[v.id]);
}
