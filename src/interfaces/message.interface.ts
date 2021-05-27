export interface IMessage<T = string, D = unknown> {
  type: T;
  data: D;
}
