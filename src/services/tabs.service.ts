import { Service } from 'typedi';
import { bindCallback, fromEventPattern, merge, Observable, of } from 'rxjs';
import {debounceTime, filter, map, switchMap} from 'rxjs/operators';

@Service()
export class TabsService {
  static getCurrentTab(): Observable<chrome.tabs.Tab | null> {
    if (!chrome.tabs) {
      return of(null);
    }
    return bindCallback(chrome.tabs.query.bind(chrome.tabs)).call(this, {
      active: true,
      currentWindow: true
    })
      .pipe(filter<chrome.tabs.Tab[]>(tabs => tabs?.length > 0))
      .pipe(map(tabs => tabs[0]));
  }

  static onTabActivated(): Observable<unknown> {
    if (!chrome.tabs) {
      return of(null);
    }
    return merge(
      fromEventPattern(chrome.tabs.onActivated.addListener.bind(chrome.tabs.onActivated)),
      fromEventPattern<[tabId: number, changeInfo: chrome.tabs.TabChangeInfo]>(chrome.tabs.onUpdated.addListener.bind(chrome.tabs.onUpdated)).pipe(
        filter(([, changeInfo]) => changeInfo.status === 'complete'),
      ),
      of(1),
    );
  }

  static getCurrentTabStream(): Observable<chrome.tabs.Tab> {
    return TabsService.onTabActivated()
      .pipe(debounceTime(100))
      .pipe(switchMap(() => TabsService.getCurrentTab()));
  }

  getCurrentTabId(): Observable<number> {
    return TabsService.getCurrentTabStream()
      .pipe(map(tab => tab.id));
  }
}
