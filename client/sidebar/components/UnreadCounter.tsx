import React, { FC } from "react";
import { ISubscription } from "../../../definition/ISubscription";

/**
 * show the unread counter as a seperate component implementation
 * - *2 new unread **private/public** rooms*
 * - *4 new mentions from 3 rooms*
 * - *5 new messages from 4 direct chats*
 * @param roomList past the roomList from the useRoomList hook
 */
const UnreadCounter: FC<ISubscription[]> = (roomList) => {
  let userMentions: number = 0;
  let directNewMessages: number = 0;
  let unreadDirectRooms: number = 0;
  let unreadPublicRooms: number = 0;
  let unreadPrivateRooms: number = 0;

  roomList.forEach((room) => {
    if (!((room.alert || room.unread) && !room.hideUnreadStatus)) {
      return;
    }

    if (room.t === "c") {
      unreadPublicRooms++;
    }

    if (room.t === "p") {
      unreadPrivateRooms++;
    }

    if (room.t === "d") {
      unreadDirectRooms++;
      directNewMessages += room.unread;
    }

    userMentions += room.userMentions;
    
  });

  console.log('you have ',userMentions,directNewMessages,unreadDirectRooms,unreadPublicRooms,unreadPrivateRooms)

  return <div>awesome</div>;
};

export default UnreadCounter;
