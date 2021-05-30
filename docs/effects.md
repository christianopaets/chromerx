# Effects example

```ts
import {Actions, Effect, Effects, ofType} from 'chromerx';
import {Service} from 'typedi';
import {AuthStore} from '../auth.store';
import {AuthActions} from './auth.actions';
import {AuthService} from '../services/auth.service';
import {switchMap} from 'rxjs/operators';

@Service()
export class AuthEffects extends Effects {

  constructor(private readonly actions$: Actions,
              private readonly authStore: AuthStore,
              private readonly authService: AuthService) {
    super();
  }

  @Effect()
  login$ = this.actions$
    .pipe(ofType<AuthActions.Login>(AuthActions.TActions.Login))
    .pipe(switchMap(action => this.authService.login(action.payload)
      .pipe(switchMap(res => this.authStore.saveState(new AuthActions.LoginSuccess(res))))
    ));

  init(): void {
    this.authStore.dispatch(new this.authStore.actions.Init());
  }
}
```
