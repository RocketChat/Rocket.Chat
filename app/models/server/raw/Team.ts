import { Collection, FindOneOptions, Cursor, UpdateWriteOpResult, DeleteWriteOpResultObject, FilterQuery } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ITeam, TEAM_TYPE } from '../../../../definition/ITeam';

type T = ITeam;
export class TeamRaw extends BaseRaw<T> {
	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		super(col, trash);

		this.col.createIndex({ name: 1 }, { unique: true });

		// this.col.createIndexes([
		// 	{ key: { status: 1, expireAt: 1 } },
		// ]);
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

	findByNameAndTeamIds(name: string | RegExp, teamIds: Array<string>, options?: FindOneOptions<T>): Cursor<T> {
		return this.col.find({
			name,
			$or: [{
				type: 0,
			}, {
				_id: {
					$in: teamIds,
				},
			}],
		}, options);
	}

	findOneByName(name: string | RegExp, options?: FindOneOptions<T>): Promise<T | null> {
		return this.col.findOne({ name }, options);
	}

	findOneByMainRoomId(roomId: string, options?: FindOneOptions<T>): Promise<T | null> {
		return this.col.findOne({ roomId }, options);
	}

	updateMainRoomForTeam(id: string, roomId: string): Promise<UpdateWriteOpResult> {
		return this.updateOne({
			_id: id,
		}, {
			$set: {
				roomId,
			},
		});
	}

	deleteOneById(id: string): Promise<DeleteWriteOpResultObject> {
		return this.col.deleteOne({
			_id: id,
		});
	}

	deleteOneByName(name: string): Promise<DeleteWriteOpResultObject> {
		return this.col.deleteOne({ name });
	}

	updateNameAndType(teamId: string, nameAndType: { name?: string; type?: TEAM_TYPE }): Promise < UpdateWriteOpResult > {
		const query = {
			_id: teamId,
		};

		const update = {
			$set: {},
		};

		if (nameAndType.name) {
			Object.assign(update.$set, { name: nameAndType.name });
		}

		if (typeof nameAndType.type !== 'undefined') {
			Object.assign(update.$set, { type: nameAndType.type });
		}

		return this.updateOne(query, update);
	}
}
