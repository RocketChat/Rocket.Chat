import { Collection, WithoutProjection, FindOneOptions, Cursor, UpdateWriteOpResult, DeleteWriteOpResultObject, FilterQuery } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ITeam, TEAM_TYPE } from '../../../../definition/ITeam';

export class TeamRaw extends BaseRaw<ITeam> {
	constructor(
		public readonly col: Collection<ITeam>,
		public readonly trash?: Collection<ITeam>,
	) {
		super(col, trash);

		this.col.createIndex({ name: 1 }, { unique: true });

		// this.col.createIndexes([
		// 	{ key: { status: 1, expireAt: 1 } },
		// ]);
	}


	findByNames(names: Array<string>): Cursor<ITeam>;

	findByNames(names: Array<string>, options: WithoutProjection<FindOneOptions<ITeam>>): Cursor<ITeam>;

	findByNames<P>(names: Array<string>, options: FindOneOptions<P extends ITeam ? ITeam : P>): Cursor<P>;

	findByNames<P>(names: Array<string>, options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>): Cursor<P> | Cursor<ITeam> {
		if (options === undefined) {
			return this.col.find({ name: { $in: names } });
		}
		return this.col.find({ name: { $in: names } }, options);
	}

	findByIds(ids: Array<string>, query?: FilterQuery<ITeam>): Cursor<ITeam>;

	findByIds(ids: Array<string>, options: WithoutProjection<FindOneOptions<ITeam>>, query?: FilterQuery<ITeam>): Cursor<ITeam>;

	findByIds<P>(ids: Array<string>, options: FindOneOptions<P extends ITeam ? ITeam : P>, query?: FilterQuery<ITeam>): Cursor<P>;

	findByIds<P>(ids: Array<string>, options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>, query?: FilterQuery<ITeam>): Cursor<P> | Cursor<ITeam> {
		if (options === undefined) {
			return this.col.find({ _id: { $in: ids }, ...query });
		}

		return this.col.find({ _id: { $in: ids }, ...query }, options);
	}

	findByIdsAndType(ids: Array<string>, type: TEAM_TYPE): Cursor<ITeam>;

	findByIdsAndType(ids: Array<string>, type: TEAM_TYPE, options: WithoutProjection<FindOneOptions<ITeam>>): Cursor<ITeam>;

	findByIdsAndType<P>(ids: Array<string>, type: TEAM_TYPE, options: FindOneOptions<P extends ITeam ? ITeam : P>): Cursor<P>;

	findByIdsAndType<P>(ids: Array<string>, type: TEAM_TYPE, options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>): Cursor<P> | Cursor<ITeam> {
		if (options === undefined) {
			return this.col.find({ _id: { $in: ids }, type });
		}
		return this.col.find({ _id: { $in: ids }, type }, options);
	}


	findByType(type: number,): Cursor<ITeam>;

	findByType(type: number, options: WithoutProjection<FindOneOptions<ITeam>>): Cursor<ITeam>;

	findByType<P>(type: number, options: FindOneOptions<P extends ITeam ? ITeam : P>): Cursor<P>;

	findByType<P>(type: number, options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>): Cursor<ITeam> | Cursor<P> {
		if (options === undefined) {
			return this.col.find({ type }, options);
		}
		return this.col.find({ type }, options);
	}


	findByNameAndTeamIds(name: string | RegExp, teamIds: Array<string>): Cursor<ITeam>;

	findByNameAndTeamIds(name: string | RegExp, teamIds: Array<string>, options: WithoutProjection<FindOneOptions<ITeam>>): Cursor<ITeam>;

	findByNameAndTeamIds<P>(name: string | RegExp, teamIds: Array<string>, options: FindOneOptions<P extends ITeam ? ITeam : P>): Cursor<P>;

	findByNameAndTeamIds<P>(name: string | RegExp, teamIds: Array<string>, options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>): Cursor<P> | Cursor<ITeam> {
		if (options === undefined) {
			return this.col.find({
				name,
				$or: [{
					type: 0,
				}, {
					_id: {
						$in: teamIds,
					},
				}],
			});
		}
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

	findOneByName(name: string | RegExp): Promise<ITeam | null>;

	findOneByName(name: string | RegExp, options: WithoutProjection<FindOneOptions<ITeam>>): Promise<ITeam | null>;

	findOneByName<P>(name: string | RegExp, options: FindOneOptions<P>): Promise<P | null>;

	findOneByName<P>(name: string | RegExp, options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>): Promise<P | null> | Promise<ITeam | null> {
		if (options === undefined) {
			return this.col.findOne({ name });
		}
		return this.col.findOne({ name }, options);
	}


	findOneByMainRoomId(roomId: string): Promise<ITeam | null>;

	findOneByMainRoomId(roomId: string, options: WithoutProjection<FindOneOptions<ITeam>>): Promise<ITeam | null>;

	findOneByMainRoomId<P>(roomId: string, options: FindOneOptions<P>): Promise<P | null>;

	findOneByMainRoomId<P>(roomId: string, options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>): Promise<P | null> | Promise<ITeam | null> {
		return options ? this.col.findOne({ roomId }, options) : this.col.findOne({ roomId });
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
