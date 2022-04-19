import type { IMDMSession, IMDMSessionParams } from "./IMDMSession";

export type SessionsEndpoints = {
  "sessions.list": {
    GET: (params: IMDMSessionParams) => IMDMSession;
  };

  "sessions.list.all": {
    GET: (params: IMDMSessionParams) => IMDMSession;
  };
};
