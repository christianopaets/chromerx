# Actions example

```ts
import { Actions } from 'chromerx';

export namespace AuthActions {

  export enum TActions {
    Init = '[Auth] Init',
    Login = '[Auth] Login',
    LoginSuccess = '[Auth] Login success'
  }

  export class Init implements Actions {
    readonly type = TActions.Init;
  }

  export class Login implements Actions {
    readonly type = TActions.Login;

    constructor(readonly payload: {email: string; password: string}) {
    }
  }

  export class LoginSuccess implements Actions {
    readonly type = TActions.LoginSuccess;

    constructor(readonly payload: {token: string}) {
    }
  }

  export type TAll = Init | Login | LoginSuccess;
}
```

