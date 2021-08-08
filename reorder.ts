import { Interceptor, Queue } from "./types.ts";
import { KahnGraph } from "./deps.ts";

export function reorder<T>(queue: Queue<T>): Queue<T> {
  const idToInterceptor: Record<string, Interceptor<T>> = {};
  for (let i = 0; i < queue.length; ++i) {
    idToInterceptor[i.toString()] = queue[i];
  }

  const nameToId: Record<string, string> = {};
  for (const id in idToInterceptor) {
    nameToId[idToInterceptor[id].name] = id;
  }

  const graph = new KahnGraph();
  for (const id in idToInterceptor) {
    const interceptor = idToInterceptor[id];
    if (interceptor.requires != null) {
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
