import type { IUser } from "./IUser";

export enum ServerEventType {
  FAILED_LOGIN_ATTEMPT = "failed-login-attempt",
  LOGIN = "login",
  SETTING_MODIFIED = 'setting-modified',
}

export interface IServerEvent {
  _id: string;
  t: ServerEventType;
  indexHash: string;
  ts: Date;
  ip?: string;
  u?: Partial<Pick<IUser, "_id" | "username">>;
  extraData?: Record<string, unknown>;
}
