import React, { FC, MutableRefObject } from "react";
import { Box, Button } from "@rocket.chat/fuselage";

import { ISubscription } from "../../../definition/ISubscription";
import { TranslationContextValue } from "../../contexts/TranslationContext";

/**
 * show the unread counter as a seperate component implementation
 * - ***New messages***
 * - ~*2 new unread **private/public** rooms*~
 * - ~*4 new mentions from 3 rooms*~
 * - ~*5 new messages from 4 direct chats*~
 * @param roomsList past the roomsList from the useRoomList hook
 */
const UnreadCounter: FC<{
  roomsList: ISubscription[] | undefined;
  t: TranslationContextValue["translate"];
  virtuosoRef: MutableRefObject<any>;
}> = ({ roomsList, t, virtuosoRef }) => {
  if (!roomsList || !Array.isArray(roomsList)) return null;

  const hasUnread: boolean = roomsList.some(
    (room) => (room.alert || room.unread) && !room.hideUnreadStatus
  );

  if (!hasUnread) return null;

  return (
    <Box textAlign="center" fontStyle="italic">
      <Button
        nude
        info
        onClick={() =>
          virtuosoRef.current.scrollToIndex({ index: 0, behavior: "smooth" })
        }
      >
        {t("New_messages")}
      </Button>
    </Box>
  );
};

export default UnreadCounter;
