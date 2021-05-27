import { Inject, Service } from "typedi";
import { Subject } from "rxjs";
import { Action } from "./interfaces/action";
import { filter } from "rxjs/operators";
import { MessagesService } from "./services/messages.service";
import { APP } from "./app.injector";
import { TMessagesType } from "./enums/messages.type";
import { TApplication } from "./enums/application.enum";

@Service()
export class Actions extends Subject<Action> {

  constructor(private readonly messagesService: MessagesService,
              @Inject(APP) private readonly app: TApplication) {
    super();
    this.messagesService.getMessage$<TMessagesType, Action>(TMessagesType.StoreAction)
      .pipe(filter(() => this.app === TApplication.Background))
      .subscribe(action => this.next(action));
  }

  dispatch(action: Action): void {
    if (this.app === TApplication.Content) {
      this.messagesService.sendMessage(TMessagesType.StoreAction, action);
    } else {
      this.next(action);
    }
  }

  complete(): void {
    // noop
  }
}
