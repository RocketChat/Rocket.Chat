import { Base } from './_Base';

class OutOfOfficeUsers extends Base {
	constructor() {
		super('OutOfOfficeUsers');
	}

	// insert
	createWithFullOutOfOfficeData(
		data: Omit<IOutOfOfficeUser, '_id'>,
	): Record<string, unknown> {
		return this.upsert({ userId: data.userId }, { $set: data });
	}

	// find
	findOneByUserId(userId: IOutOfOfficeUser['userId'], options = {}): IOutOfOfficeUser {
		return this.findOne({ userId }, options);
	}

	findEnabledByUserIds(userIds: string[]): Pick<IOutOfOfficeUser, '_id'|'customMessage'|'userId'>[] {
		return this.find({ userId: { $in: userIds }, isEnabled: true }, { fields: { customMessage: 1, userId: 1 } }).fetch();
	}

	findAllFromRoomId(roomId: string): IOutOfOfficeUser[] {
		return this.find({ roomIds: { $in: [roomId] }, sentRoomIds: { $nin: [roomId] } });
	}

	// update

	updateSentRoomIds(docId: IOutOfOfficeUser['_id'], roomId: string): void {
		return this.update({ _id: docId }, { $push: { sentRoomIds: roomId } });
	}

	setDisabled(userId: string): number {
		return this.update({ userId }, { $set: { isEnabled: false } });
	}
}

export interface IOutOfOfficeUser {
	_id: string;
	isEnabled: boolean;
	userId: string;
	roomIds: string[];
	customMessage: string;
	startDate: string;
	endDate: string;
}

export default new OutOfOfficeUsers();
