import {bindCallback, fromEventPattern, Observable} from 'rxjs';
import {filter, map, switchMap, take, tap} from 'rxjs/operators';
import {Service} from 'typedi';
import 'reflect-metadata';
import { TabsService } from "./tabs.service";
import { IMessage } from "../interfaces/message.interface";

@Service()
export class MessagesService {

  constructor(private readonly tabsService: TabsService) {

  }

  sendMessage<T = string, D = unknown>(type: T, message: D, toTab: boolean = false): void {
    const newMessage: IMessage<T, D> = this._createMessage<T, D>(type, message);
    chrome.runtime.sendMessage(newMessage);
    if (toTab) {
      this._sendMessageToTab<T, D>(newMessage);
    }
  }

  sendMessageWithCallback<T, C>(type: T): Observable<C> {
    const message = this._createMessage<T, null>(type, null);
    const callback = bindCallback(chrome.tabs.sendMessage.bind(chrome.tabs));
    return this.tabsService.getCurrentTabId()
      .pipe(take(1))
      .pipe(switchMap((tabId): Observable<C> => callback.call(this, tabId, message, {})))
      .pipe(tap(() => {
        if (chrome.runtime.lastError) {
          // Need to prevent error throwing
          console.log(chrome.runtime.lastError.message);
        }
      }));
  }

  sendCallback<T = string, C = unknown>(type: T, callback: C): Observable<void> {
    return fromEventPattern<[IMessage<T>, unknown, (res: C) => void]>(chrome.runtime.onMessage.addListener.bind(chrome.runtime.onMessage))
      .pipe(filter<[IMessage<T>, unknown, (res: C) => void]>(([message]) => message.type === type))
      .pipe(map(([, ,sendResponse]) => sendResponse(callback)));
  }

  getMessageRoot$<T = string, D = unknown>(): Observable<IMessage<T, D>> {
    return fromEventPattern<[IMessage<T, D>]>(chrome.runtime.onMessage.addListener.bind(chrome.runtime.onMessage))
      .pipe(map(([message]) => message));
  }

  getMessage$<T = string, D = unknown>(type: T): Observable<D> {
    return this.getMessageRoot$<T, D>()
      .pipe(filter(message => message.type === type))
      .pipe(map(message => message.data));
  }

  private _sendMessageToTab<T, D>(message: IMessage<T, D>): void {
    this.tabsService.getCurrentTabId()
      .pipe(take(1))
      .subscribe(tabId => chrome.tabs.sendMessage(tabId, message));
  }

  protected _createMessage<T, D>(type: T, data: D): IMessage<T, D> {
    return {type, data};
  }
}
