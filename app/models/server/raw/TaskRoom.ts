import { Collection, FindOneOptions, DeleteWriteOpResultObject } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ITaskRoom } from '../../../../definition/ITaskRoom';

type T = ITaskRoom;
export class TaskRoom extends BaseRaw<T> {
	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		super(col, trash);

		this.col.createIndex({ name: 1 }, { unique: true });
	}

	findOneByName(name: string | RegExp, options?: FindOneOptions<T>): Promise<T | null> {
		return this.col.findOne({ name }, options);
	}

	findOneByMainRoomId(roomId: string, options?: FindOneOptions<T>): Promise<T | null> {
		return this.col.findOne({ roomId }, options);
	}

	deleteOneById(id: string): Promise<DeleteWriteOpResultObject> {
		return this.col.deleteOne({
			_id: id,
		});
	}

	deleteOneByName(name: string): Promise<DeleteWriteOpResultObject> {
		return this.col.deleteOne({ name });
	}
}
