import { Interceptor } from "./types.ts";
import * as toposort from "./toposort.ts";

//deno-lint-ignore no-explicit-any
export function reorder<T extends Interceptor<any>>(
  interceptors: Array<T>,
): Array<T> {
  const nameToInterceptor = interceptors.reduce((res, interceptor) => {
    res[interceptor.name] = interceptor;
    return res;
  }, {} as Record<string, T>);

  const graphMap = interceptors.reduce((res, interceptor) => {
    const name = interceptor.name;
    const depends = res[name] ?? new Set<string>();

    if (interceptor.requireOthers) {
      for (const i of interceptors) {
        if (i.name === name) continue;
        depends.add(i.name);
      }
      res[name] = depends;
    } else {
      for (const v of interceptor.requires ?? []) depends.add(v);
      res[name] = depends;
    }
    return res;
  }, {} as toposort.GraphMap);

  return toposort
    .sort(graphMap)
    .map((name) => nameToInterceptor[name])
    .reverse();
}
