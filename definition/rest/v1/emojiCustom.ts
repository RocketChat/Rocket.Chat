import type { ICustomEmojiDescriptor } from "../../ICustomEmojiDescriptor";
import { Serialized } from "../../Serialized";
import { PaginatedRequest } from "../helpers/PaginatedRequest";
import { PaginatedResult } from "../helpers/PaginatedResult";

export type EmojiCustomEndpoints = {
  "emoji-custom.all": {
    GET: (
      params: { query: string } & PaginatedRequest & {
          sort: string; //{name: "asc" | "desc";}>;
        }
    ) => {
      emojis: ICustomEmojiDescriptor[];
    } & PaginatedResult;
  };
  "emoji-custom.list": {
    GET: (params: { query: string }) => {
      emojis?: {
        update: ICustomEmojiDescriptor[];
      };
    };
  };
  "emoji-custom.delete": {
    POST: (params: { emojiId: ICustomEmojiDescriptor["_id"] }) => void;
  };
};
