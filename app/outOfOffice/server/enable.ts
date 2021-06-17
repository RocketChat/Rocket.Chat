import { Users, OutOfOffice, Rooms, Subscriptions } from "../../models/server";

// refactor the below line into definition?
import { IOutOfOffice } from "../../models/server/models/OutOfOffice";
import { IUser } from "../../../definition/IUser";
import { IRoom } from "../../../definition/IRoom";
import { ISubscription } from "../../../definition/ISubscription";

interface IEnableOutOfOfficeParams {
  userId: string;
  roomIds: string[];
  customMessage: string;
  startDate: Date;
  endDate: Date;
}

function getSubscribedRoomIds(roomIds: string[], currentUser: IUser): string[] {
  const subscribedRoomIds: IRoom["_id"][] = [];
  for (const roomId of roomIds) {
    const room: IRoom = Rooms.findOneById(roomId);
    if (!room) {
      // this room does not exist

      // this should not happen if the user entered the details via the ui
      // but if he used the api, then should we inform?
      continue;
    }

    const subscriptions: ISubscription[] = Subscriptions.findByRoomIdAndUserIds(
      room._id,
      [currentUser._id],
      { fields: { rid: 1 } }
    ).fetch();

    if (
      Array.isArray(subscriptions) &&
      subscriptions.length > 0 &&
      subscriptions[0].rid === room._id
    ) {
      subscribedRoomIds.push(room._id);
    }
  }
  return subscribedRoomIds;
}

export function enableOutOffice({
  userId,
  customMessage,
  roomIds,
  startDate,
  endDate,
}: IEnableOutOfOfficeParams) {
  // get the current user
  const currentUser: IUser = Users.findOneById(userId);

  // get the corresponding OutOfOffice document for this user
  const currentOutOfOffice:
    | IOutOfOffice
    | undefined = OutOfOffice.findOneByUserId(currentUser._id);

  // create a new document if currentOutOfOffice does not exist
  if (!currentOutOfOffice) {
    const subscribedRoomIds = getSubscribedRoomIds(roomIds, currentUser);
    const newDocumentId = OutOfOffice.createWithFullOutOfOfficeData({
      userId: currentUser._id,
      roomIds: subscribedRoomIds,
      customMessage,
      startDate,
      endDate,
      sentRoomIds: [],
      isEnabled: true,
    });

    if (!newDocumentId) {
      throw new Meteor.Error(
        "error-invalid-document",
        "A new Out Of Office document could not be created"
      );
    }

    return OutOfOffice.findOneById(newDocumentId);
  }

  if (currentOutOfOffice.isEnabled === true) {
    // already enabled - nothing to do
    throw new Meteor.Error(
      "error-not-allowed",
      "Out Of Office is already enabled."
    );
  }

  // update the existing one associated with this user

  const subscribedRoomIds = getSubscribedRoomIds(roomIds, currentUser);
  OutOfOffice.setDataWhenEnabled(
    currentOutOfOffice._id,
    {
      roomIds: subscribedRoomIds,
      customMessage,
      startDate,
      endDate,
    }
  );

  return OutOfOffice.findOneById(currentOutOfOffice._id) ;
}
