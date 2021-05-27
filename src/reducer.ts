import {Action} from './interfaces/action';

export abstract class Reducer<B> {

  abstract defaultValue: B;

  abstract reducer(state: B, action: Action): B;
}
