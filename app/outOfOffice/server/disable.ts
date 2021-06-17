import { Users, OutOfOffice } from "../../models/server";

import { IOutOfOffice } from "../../models/server/models/OutOfOffice";
import { IUser } from "../../../definition/IUser";

interface IOutOfOfficeDisableParams {
  userId: IOutOfOffice["userId"];
}

export function disableOutOfOffice({ userId }: IOutOfOfficeDisableParams) {
  const currentUser: IUser = Users.findOneById(userId);

  if (!currentUser) {
    return;
  }

  const foundDocument = OutOfOffice.findOneByUserId(currentUser._id);
  if (!foundDocument) {
    // user has never enabled Out of Office - HANDLE THIS CASE
    return;
  }

  if (foundDocument.isEnabled === false) {
    // already disabled - nothing to do
    return;
  }

  const updatedDocument = OutOfOffice.setDisabled(foundDocument._id);
  return updatedDocument;
}
