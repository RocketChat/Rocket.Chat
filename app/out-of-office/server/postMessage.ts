import { Meteor } from "meteor/meteor";

import { IMessage } from "../../../definition/IMessage";
import { IRoom } from "../../../definition/IRoom";
import { OutOfOffice } from "../../models/server";
import { executeSendMessage } from "../../lib/server/methods/sendMessage";
import { callbacks } from "../../callbacks/server";

async function handlePostMessage(message: IMessage, room: IRoom) {
  const foundDocuments = OutOfOffice.findAllFromRoomId(room._id);
  await Promise.all(
    foundDocuments.map((foundDocument) => {
      console.log("the found document was -->", foundDocument);

      OutOfOffice.updateRoomAsDisabled(foundDocument._id);

      const customMessage = {
        msg: foundDocument.customMessage,
        rid: room._id,
      };

      executeSendMessage(foundDocument.userId, customMessage);
    })
  ).catch((e) => {
    throw new Meteor.Error(
      "error-afterSaveMessage-outOfOffice",
      JSON.stringify(e)
    );
  });

  return message;
}

callbacks.add(
  "afterSaveMessage",
  handlePostMessage,
  callbacks.priority.LOW,
  "outOfOfficePostMessage"
);
