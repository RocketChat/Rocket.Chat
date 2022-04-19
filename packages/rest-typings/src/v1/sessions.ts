import type { IMDMSession, IMDMSessionParams } from "@rocket.chat/core-typings";

export type SessionsEndpoints = {
  "sessions.list": {
    GET: (params: IMDMSessionParams) => IMDMSession;
  };

  "sessions.list.all": {
    GET: (params: IMDMSessionParams) => IMDMSession;
  };
};
