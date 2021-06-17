import { Users, OutOfOffice } from "../../models/server";

import { IOutOfOffice } from "../../models/server/models/OutOfOffice";
import { IUser } from "../../../definition/IUser";

interface IOutOfOfficeDisableParams {
  userId: IOutOfOffice["userId"];
}

export function disableOutOfOffice({ userId }: IOutOfOfficeDisableParams) {
  const currentUser: IUser = Users.findOneById(userId);

  const foundDocument = OutOfOffice.findOneByUserId(currentUser._id);
  if (!foundDocument) {
    // user has never enabled Out of Office - HANDLE THIS CASE
    throw new Meteor.Error(
      "error-not-found",
      "Out Of Office is already disabled."
    );
  }

  if (foundDocument.isEnabled === false) {
    // already disabled - nothing to do
    throw new Meteor.Error(
      "error-not-allowed",
      "Out Of Office is already disabled."
    );
  }

  OutOfOffice.setDisabled(foundDocument._id);

  const updatedDocument = OutOfOffice.findOneById(foundDocument._id);
  return updatedDocument;
}
