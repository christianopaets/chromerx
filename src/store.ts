import { Inject, Service } from "typedi";
import { APP } from "./app.injector";
import { BehaviorSubject, Observable } from "rxjs";
import { map, switchMap, tap } from "rxjs/operators";
import { TabsService } from "./services/tabs.service";
import { Actions } from "./actions";
import { MessagesService } from "./services/messages.service";
import { TApplication } from "./enums/application.enum";
import { TMessagesType } from "./enums/messages.type";
import { Reducer } from "./reducer";
import get from 'lodash/get';
import { StorageService } from "./services/storage.service";
import { Action } from "./interfaces/action";

@Service()
export abstract class Store<B> {

  @Inject()
  private readonly _tabsService: TabsService;

  @Inject()
  private readonly messagesService: MessagesService;

  @Inject()
  protected readonly storageService: StorageService<Record<string, B>>;

  @Inject()
  protected readonly actions$: Actions;

  @Inject(APP)
  private readonly app: TApplication;

  protected abstract _storeName: string;

  protected _reducer: Reducer<B> = this.reducer;

  protected _state: BehaviorSubject<B> = new BehaviorSubject<B>(this.reducer.defaultValue);

  abstract actions;

  get storeName(): string {
    return this._storeName;
  }

  protected constructor(protected readonly reducer: Reducer<B>) {
  }

  selectRoot$(): Observable<B> {
    return this.storageService.select$(this._storeName);
  }

  selectRootInstant$(): Observable<B> {
    return this.storageService.selectInstant$(this._storeName);
  }

  selectRoot(): B {
    return this.storageService.select(this._storeName);
  }

  select$<T extends keyof B>(arg1: T): Observable<B[T]>;
  select$<T extends keyof B, K extends keyof B[T]>(arg1: T, arg2: K): Observable<B[T][K]>;
  select$<T extends keyof B, K extends keyof B[T], Z extends keyof B[T][K]>(arg1: T, arg2: K, arg3: Z): Observable<B[T][K][Z]>;
  // eslint-disable-next-line max-len
  select$<T extends keyof B, K extends keyof B[T], Z extends keyof B[T][K], X extends keyof B[T][K][Z]>(arg1: T, arg2: K, arg3: Z, arg4: X): Observable<B[T][K][Z][X]>;
  // eslint-disable-next-line max-len
  select$<T extends keyof B, K extends keyof B[T], Z extends keyof B[T][K], X extends keyof B[T][K][Z], Y extends keyof B[T][K][Z][X]>(arg1: T, arg2: K, arg3: Z, arg4: X, arg5: Y): Observable<B[T][K][Z][X][Y]>;
  // eslint-disable-next-line max-len
  select$<T extends keyof B, K extends keyof B[T], Z extends keyof B[T][K], X extends keyof B[T][K][Z], Y extends keyof B[T][K][Z][X], L extends keyof B[T][K][Z][X][Y]>(arg1: T, arg2: K, arg3: Z, arg4: X, arg5: Y, arg6: L): Observable<B[T][K][Z][X][Y][L]>;
  select$(...args: string[]): unknown {
    return this.selectRoot$()
      .pipe(map(value => get(value, args)));
  }

  selectInstant$<T extends keyof B>(arg1: T): Observable<B[T]>;
  selectInstant$<T extends keyof B, K extends keyof B[T]>(arg1: T, arg2: K): Observable<B[T][K]>;
  selectInstant$<T extends keyof B, K extends keyof B[T], Z extends keyof B[T][K]>(arg1: T, arg2: K, arg3: Z): Observable<B[T][K][Z]>;
  selectInstant$(...args: string[]): unknown {
    return this.storageService.selectInstant$(this._storeName)
      .pipe(map(value => get(value, args)));
  }

  select<T extends keyof B>(arg1: T): B[T];
  select<T extends keyof B, K extends keyof B[T]>(arg1: T, arg2: K): B[T][K];
  select<T extends keyof B, K extends keyof B[T], Z extends keyof B[T][K]>(arg1: T, arg2: K, arg3: Z): B[T][K][Z];
  // eslint-disable-next-line max-len
  select<T extends keyof B, K extends keyof B[T], Z extends keyof B[T][K], X extends keyof B[T][K][Z]>(arg1: T, arg2: K, arg3: Z, arg4: X): B[T][K][Z][X];
  // eslint-disable-next-line max-len
  select<T extends keyof B, K extends keyof B[T], Z extends keyof B[T][K], X extends keyof B[T][K][Z], Y extends keyof B[T][K][Z][X]>(arg1: T, arg2: K, arg3: Z, arg4: X, arg5: Y): B[T][K][Z][X][Y];
  // eslint-disable-next-line max-len
  select<T extends keyof B, K extends keyof B[T], Z extends keyof B[T][K], X extends keyof B[T][K][Z], Y extends keyof B[T][K][Z][X], L extends keyof B[T][K][Z][X][Y]>(arg1: T, arg2: K, arg3: Z, arg4: X, arg5: Y, arg6: L): B[T][K][Z][X][Y][L];
  select(...args: string[]): unknown {
    return get(this.selectRoot(), args);
  }

  saveState(action: Action): Observable<B> {
    return this._saveStateRoot(action);
  }

  private _saveStateRoot(action: Action): Observable<B> {
    return this.storageService.selectInstant$(this._storeName)
      .pipe(map((state) => this._reducer.reducer(state, action)))
      .pipe(switchMap(newState => this._setValue(newState)))
      .pipe(tap(() => this.messagesService.sendMessage(TMessagesType.StateChange, action, true)))
      .pipe(tap(() => this.actions$.dispatch(action)));
  }

  private _setValue(state: B): Observable<B> {
    return this.storageService.setValue(this._storeName, state);
  }

  dispatch(action: Action): void {
    this.saveState(action)
      .subscribe();
  }
}
