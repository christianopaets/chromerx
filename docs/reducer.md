# Reducer example

```ts
import {Reducer} from 'chromerx';
import {IAuthState} from './auth.state';
import {AuthActions} from './auth.actions';
import {Service} from 'typedi';

@Service()
export class AuthReducer extends Reducer<IAuthState> {
  
  readonly defaultValue: IAuthState = {
    loading: false,
    token: null
  }

  reducer(state: IAuthState, action: AuthActions.TAll): IAuthState {
    switch (action.type) {

      case AuthActions.TActions.Init: {
        return state ? state : this.defaultValue;
      }
      
      case AuthActions.TActions.Login: {
        return {
          ...state,
          loading: true
        };
      }

      case AuthActions.TActions.LoginSuccess: {
        return {
          ...state,
          token: action.payload,
          loading: false
        };
      }
    }
    return state;
  }
}
```
