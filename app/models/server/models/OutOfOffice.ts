import { Base } from './_Base';

class OutOfOffice extends Base {
	constructor() {
		super('OutOfOffice');
	}

	// insert
	createWithFullOutOfOfficeData(
		data: Omit<IOutOfOffice, '_id'>,
	): Record<string, unknown> {
		return this.upsert({ userId: data.userId, roomId:data.roomId }, { ...data });
	}

	// find
	findOneByUserId(userId: IOutOfOffice['userId'], options = {}): IOutOfOffice {
		return this.findOne({ userId }, options);
	}

	findAllFromRoomId(roomId:string):IOutOfOffice[]{
		return this.find({roomIds:{$in:[roomId]},sentRoomIds:{$nin:[roomId]}});
	}

	// update

	updateSentRoomIds(docId: IOutOfOffice["_id"], roomId: string) {
		return this.update({ _id: docId }, { $push: { sentRoomIds: roomId } });
	  }

	  /**set all documents matching this **userId** to `isEnabled: false` */
	setDisabled(userId: string): number {
		return this.update({ userId }, { $set: { isEnabled: false } }, {multi:true});
	}
}

export interface IOutOfOffice {
	_id: string;
	isEnabled: boolean;
	userId: string;
	roomId: string;
	customMessage: string;
	startDate: string;
	endDate: string;
}

export default new OutOfOffice();
