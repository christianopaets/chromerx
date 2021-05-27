import { Action } from "./interfaces/action";
import { filter } from "rxjs/operators";
import { MonoTypeOperatorFunction } from "rxjs";

export function ofType<V extends Action>(...keys: string[]): MonoTypeOperatorFunction<V> {
  // @ts-ignore
  return filter.call<typeof ofType, [(action: Action) => boolean], unknown>(this,  ({ type }) => {
    const len = keys.length;
    if (len === 1) {
      return type === keys[0];
    } else {
      for (let i = 0; i < len; i++) {
        if (keys[i] === type) {
          return true;
        }
      }
    }
    return false;
  }) as MonoTypeOperatorFunction<V>;
}
