import { Base } from "./_Base";

class OutOfOffice extends Base {
  constructor() {
    super("OutOfOffice");
  }
  // insert
  createWithFullOutOfOfficeData(
    data: Omit<IOutOfOffice, "_id">
  ): IOutOfOffice["_id"] {
    return this.insert(data);
  }

  // find
  findOneByUserId(userId: IOutOfOffice["userId"]): IOutOfOffice {
    return this.findOne({ userId });
  }

  // update
  setDataWhenEnabled(
    docId: string,
    {
      roomIds,
      customMessage,
      startDate,
      endDate,
    }: Pick<IOutOfOffice, "roomIds" | "customMessage" | "startDate" | "endDate">
  ) {
    return this.update(
      {
        _id: docId,
      },
      {
        $set: {
          roomIds,
          customMessage,
          startDate,
          endDate,
          isEnabled: true,
        },
      }
    );
  }

  setDisabled(docId: string) {
    return this.update({ _id: docId }, { $set: { isEnabled: false } });
  }
}

export interface IOutOfOffice {
  _id: string;
  isEnabled: boolean;
  userId: string;
  roomIds: string[];
  customMessage: string;
  sentRoomIds: string[];
  startDate?: Date;
  endDate?: Date;
}

export default new OutOfOffice();
