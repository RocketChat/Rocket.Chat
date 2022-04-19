import type { ISession } from "@rocket.chat/core-typings";

// Session for Multi Device Manager

export interface IMDMSessionParams {
  count?: number;
  offset?: number;
  search?: string | null;
}
export interface IMDMSession extends IMDMSessionParams {
  total: number;
  sessions: ISession[];
}
