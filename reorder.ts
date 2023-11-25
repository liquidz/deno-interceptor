import { Interceptor } from "./types.ts";
import * as toposort from "./toposort.ts";

export function reorder<T extends Interceptor>(
  interceptors: T[],
): T[] {
  const nameToInterceptor = interceptors.reduce((accm, interceptor) => {
    accm[interceptor.name] = interceptor;
    return accm;
  }, {} as Record<string, T>);

  // // TODO: check if there are multiple interceptors with shouldBeLast
  // if (interceptors.filter((i) => i.shouldBeLast).length > 1) {
  //
  // }

  const graphMap = interceptors.reduce((accm, interceptor) => {
    const name = interceptor.name;
    const depends = accm[name] ?? new Set<string>();

    if (interceptor.shouldBeLast) {
      for (const i of interceptors) {
        if (i.name === name) continue;
        depends.add(i.name);
      }
      accm[name] = depends;
    } else {
      for (const v of interceptor.depends ?? []) depends.add(v);
      accm[name] = depends;
    }
    return accm;
  }, {} as toposort.GraphMap);

  return toposort
    .sort(graphMap)
    .map((name) => nameToInterceptor[name])
    .reverse();
}
