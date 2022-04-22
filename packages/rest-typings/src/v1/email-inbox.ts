import type { IEmailInbox, IMessage } from "@rocket.chat/core-typings";
import type { PaginatedRequest } from "../helpers/PaginatedRequest";
import type { PaginatedResult } from "../helpers/PaginatedResult";

export type EmailInboxEndpoints = {
  "email-inbox.list": {
    GET: (
      params: PaginatedRequest<{ query?: string }>
    ) => PaginatedResult<{ emailInboxes: IEmailInbox[] }>;
  };
  "email-inbox": {
    POST: (
      params: PaginatedRequest<{
        _id?: string;
        name: string;
        email: string;
        active: boolean;
        description?: string;
        senderInfo?: string;
        department?: string;
        smtp: {
          password: string;
          port: number;
          secure: boolean;
          server: string;
          username: string;
        };
        imap: {
          password: string;
          port: number;
          secure: boolean;
          server: string;
          username: string;
        };
      }>
    ) => PaginatedResult<{ _id: string }>;
  };
  "email-inbox/:_id": {
    GET: () => IEmailInbox | null;
    DELETE: () => { _id: string };
  };
  "email-inbox.search": {
    GET: (params: { email: string }) => IEmailInbox | null;
  };
  "email-inbox.send-test/:_id": {
    POST: () => { _id: string };
  };
};
