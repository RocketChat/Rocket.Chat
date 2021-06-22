import { Meteor } from "meteor/meteor";

import { OutOfOffice } from "../../models/server";

interface IEnableOutOfOfficeParams {
  userId: string;
  roomIds: string[];
  customMessage: string;
  startDate: Date;
  endDate: Date;
  isEnabled: boolean;
}

export function updateOutOfOffice({
  userId,
  customMessage,
  roomIds,
  startDate,
  endDate,
  isEnabled,
}: IEnableOutOfOfficeParams) {
  if (!isEnabled) {
    return OutOfOffice.setDisabled(userId);
  }

  if (customMessage.length === 0) {
    throw new Meteor.Error(
      "error-invalid-params",
      "The custom message is mandatory"
    );
  }

  return OutOfOffice.createWithFullOutOfOfficeData({
    userId,
    startDate,
    endDate,
    customMessage,
    isEnabled,
    roomIds,
    sentRoomIds: [],
  });
}
