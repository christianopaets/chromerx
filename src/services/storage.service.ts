import get from 'lodash/get';
import {BehaviorSubject, bindCallback, merge, Observable, of, Subject, Subscription} from 'rxjs';
import {debounceTime, first, map, scan, startWith, switchMap} from 'rxjs/operators';
import {Inject, Service} from 'typedi';
import { APP } from "../app.injector";
import { TApplication } from "../enums/application.enum";

function skipWhileProcessingMapTo<T>(processingObservable: Observable<T>) {
  return function(source: Observable<T>) {
    return new Observable(subscriber => {
      const subscription = new Subscription();
      let processing = false;
      subscription.add(
        source.subscribe(() => {
          if (!processing) {
            processing = true;
            subscription.add(
              // eslint-disable-next-line rxjs/no-nested-subscribe
              processingObservable.subscribe(
                value => {
                  subscriber.next(value);
                },
                err => subscriber.error(err),
                () => {
                  processing = false;
                }
              )
            );
          }
        })
      );
      return () => subscription.unsubscribe();
    });
  };
}

@Service()
export class StorageService<B = unknown> {

  private readonly _chromeStorageStateChanges$ = new BehaviorSubject<B>(null);

  chromeStorageLocalGet$ = new Observable<B>(subscriber => {
    chrome.storage.local.get(items => {
      subscriber.next(items as B);
      subscriber.complete();
    });
  });

  chromeStorageStateInvalidate$ = new Subject<void>();

  chromeStorageStateChanges$: Observable<B> = this._chromeStorageStateChanges$
    .asObservable()
    .pipe(switchMap(res => {
      const keys = Object.keys(res || {});
      if (!res || keys.length === 0 || !keys.includes('auth')) {
        // @ts-ignore
        return bindCallback(chrome.storage.local.get.bind(chrome.storage.local)).call(this) as Observable<B>;
      } else {
        return of(res);
      }
    }));

  chromeStorageOnChanged$ = new Subject<chrome.storage.StorageChange>();

  constructor(@Inject(APP) private readonly app: TApplication) {
    chrome.storage.local.get(state => {
      // Set initial state from current storage state
      this._chromeStorageStateChanges$.next(state as B);

      // Subscribe for storage changes
      chrome.storage.onChanged.addListener(changes => {
        this.chromeStorageOnChanged$.next(changes);
      });

      merge(
        this.chromeStorageOnChanged$.pipe(startWith({}))
          .pipe(map(changes => {
            const stateUpdate = Object.keys(changes).reduce((acc, key) => ({...acc, [key]: changes[key].newValue}), {});
            return {...stateUpdate};
          })),
        this.chromeStorageStateInvalidate$.pipe(debounceTime(10))
          .pipe(skipWhileProcessingMapTo(this.chromeStorageLocalGet$) as never)
      )
        // @ts-ignore
        .pipe(scan<Record<string, unknown>, B | Record<string, unknown>>((acc, value) => ({...acc, ...value}), {}))
        // @ts-ignore
        .subscribe(this._chromeStorageStateChanges$);
    });
  }

  setValue<K extends keyof B>(key: K, value: B[K]): Observable<B[K]> {
    return bindCallback(chrome.storage.local.set)
      .call(chrome.storage.local, {
        [key]: value
      })
      .pipe(map(() => value));
  }

  setValueSync<K extends keyof B>(key: K, value: B[K]): void {
    chrome.storage.sync.set({
      [key]: value
    });
  }

  selectRoot$(): Observable<B> {
    this.chromeStorageStateInvalidate$.next();
    return this.chromeStorageStateChanges$;
  }

  select$<T extends keyof B>(arg1: T): Observable<B[T]>;
  select$<T extends keyof B, K extends keyof B[T]>(arg1: T, arg2: K): Observable<B[T][K]>;
  select$<T extends keyof B, K extends keyof B[T], Z extends keyof B[T][K]>(arg1: T, arg2: K, arg3: Z): Observable<B[T][K][Z]>;
  select$(...args: string[]): unknown {
    return this.selectRoot$()
      .pipe(map(value => get(value, args)))
      .pipe(map(res => {
        if ((!res || Object.keys(res).length === 0) && args.length === 1) {
          this.setValue(args[0] as keyof B, null);
          return null;
        }
        return res;
      }));
  }

  select<T extends keyof B>(key: T): B[T] | null {
    if (!this._chromeStorageStateChanges$ && !this._chromeStorageStateChanges$.value && !this._chromeStorageStateChanges$.value[key]) {
      return null;
    }
    return this._chromeStorageStateChanges$.value[key];
  }

  selectInstant$<T extends keyof B>(key: T): Observable<B[T]> {
    return this._selectRoot$()
      .pipe(map(value => get(value, key)));
  }

  private _selectRoot$(): Observable<B> {
    this.chromeStorageStateInvalidate$.next();
    return this.chromeStorageStateChanges$
      .pipe(first<B>(Boolean));
  }
}
