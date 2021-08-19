import { Collection, FindOneOptions, Cursor, DeleteWriteOpResultObject, FilterQuery } from 'mongodb';

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

	findByNames(names: Array<string>, options?: FindOneOptions<T>): Cursor<T> {
		return this.col.find({ name: { $in: names } }, options);
	}

	findByIds(ids: Array<string>, options?: FindOneOptions<T>, query?: FilterQuery<T>): Cursor<T> {
		return this.col.find({ _id: { $in: ids }, ...query }, options);
	}

	findByIdsAndType(ids: Array<string>, type: number, options?: FindOneOptions<T>): Cursor<T> {
		return this.col.find({ _id: { $in: ids }, type }, options);
	}

	findByType(type: number, options?: FindOneOptions<T>): Cursor<T> {
		return this.col.find({ type }, options);
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
