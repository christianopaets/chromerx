import {Store} from './store';
import {Effects} from './effects';
import {Service} from 'typedi';

@Service()
export abstract class StoreModule<B> {

  protected constructor(protected readonly store: Store<B>,
                        protected readonly effects: Effects) {
    this._storeInit();
    this.effects.init();
  }

  private _storeInit(): void {
    console.log(`${this.store.storeName} was init`);
  }
}
