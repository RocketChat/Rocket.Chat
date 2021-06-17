import { Base } from "./_Base";

class OutOfOffice extends Base {
  constructor() {
    super("OutOfOffice");
  }
}

export interface IOutOfOfficeModel {
  _id: string;
  isEnabled: boolean;
  userId: string;
  roomIds: string[];
  customMessage: string;
  sentRoomIds: string[];
  startDate: Date;
  endDate: Date;
}

export default new OutOfOffice();
