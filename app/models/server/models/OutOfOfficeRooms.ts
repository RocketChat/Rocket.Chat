import { Base } from './_Base';

class OutOfOfficeRooms extends Base {
	constructor() {
		super('OutOfOfficeRooms');
	}

	// insert
	addUserIdAndRoomId({
		roomId,
		userId,
	}: {
		roomId: string;
		userId: string;
	}): Record<string, unknown> {
		return this.upsert(
			{ roomId },
			{ $set: { roomId }, $addToSet: { userIds: userId } },
		);
	}

	// remove
	removeById(_id: string): Record<string, unknown> {
		return this.remove({ _id });
	}
}

export interface IOutOfOfficeRoom {
	_id: string;
	roomId: string;
	userIds: string[];
}

export default new OutOfOfficeRooms();
