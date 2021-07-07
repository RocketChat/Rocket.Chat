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
	/**all roomIds activated by this userId */
	findAllByUserId(userId: IOutOfOffice['userId'], options = {}): IOutOfOffice[] {
		return this.find({userId}, options).fetch();
	}

	findAllFromRoomId(roomId:string):Pick<IOutOfOffice,'customMessage'|'userId'|'_id'>[]{
		return this.find({isEnabled:true, roomId},{customMessage:1,userId:1});
	}

	// update
	updateRoomAsDisabled(_id:string):number{
		return this.update({_id},{$set:{isEnabled:false}});
	}

	  /**set all documents matching this **userId** to `isEnabled: false` */
	updateAllAsDisabled(userId: string): number {
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
