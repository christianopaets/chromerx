import {Observable} from 'rxjs';

export function Effect() {
  return function (target: unknown, key: string): void {
    let value: Observable<unknown>;
    const getter = function() {
      return value;
    };

    const setter = function(newVal: Observable<unknown>) {
      newVal.subscribe();
    };
    Object.defineProperty(target, key, {
      get: getter,
      set: setter
    });
  };
}
