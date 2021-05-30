# Store example

```ts
import {Observable} from 'rxjs';
import {Service} from 'typedi';
import {Store} from 'chromerx';
import {IAuthState} from './store/auth.state';
import {AuthReducer} from './store/auth.reducer';
import {AuthActions} from './store/auth.actions';

@Service()
export class AuthStore extends Store<IAuthState> {

  _storeName = 'auth';

  actions = AuthActions;

  constructor(protected readonly reducer: AuthReducer) {
    super(reducer);
  }
}
```
