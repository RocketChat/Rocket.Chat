import { IMessage } from "../../../definition/IMessage";
import { IRoom } from "../../../definition/IRoom";
import { OutOfOffice } from "../../models/server";
import { executeSendMessage } from "../../lib/server/methods/sendMessage";
import { callbacks } from "../../callbacks/server";

function handlePostMessage(_message: IMessage, room: IRoom) {
  const foundDocuments = OutOfOffice.findAllFromRoomId(room._id);
  foundDocuments.forEach((foundDocument) => {
    OutOfOffice.updateSentRoomIds(foundDocument._id, room._id);
    const customMessage = {
      msg: foundDocument.customMessage,
      rid: room._id,
    };
    executeSendMessage(foundDocument.userId, customMessage);
  });
}

callbacks.add(
  "afterSaveMessage",
  handlePostMessage,
  callbacks.priority.LOW,
  "out-of-office-post-message-handler"
);
