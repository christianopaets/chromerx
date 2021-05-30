# Module example

```ts
import {Service} from 'typedi';
import {StoreModule} from 'chromerx';
import {IAuthState} from './store/auth.state';
import {AuthStore} from './auth.store';
import {AuthEffects} from './store/auth.effects';

@Service()
export class AuthModule extends StoreModule<IAuthState> {

  constructor(protected readonly authStore: AuthStore,
              protected readonly authEffects: AuthEffects) {
    super(authStore, authEffects);
  }
}

```
