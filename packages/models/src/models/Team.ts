import type { ITeam, RocketChatRecordDeleted, TEAM_TYPE } from '@rocket.chat/core-typings';
import type { FindPaginated, ITeamModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, DeleteResult, Document, Filter, FindOptions, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class TeamRaw extends BaseRaw<ITeam> implements ITeamModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ITeam>>) {
		super(db, 'team', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { name: 1 }, unique: true }];
	}

	findByNames(names: Array<string>): FindCursor<ITeam>;

	findByNames(names: Array<string>, options: FindOptions<ITeam>): FindCursor<ITeam>;

	findByNames<P extends Document>(names: Array<string>, options: FindOptions<P extends ITeam ? ITeam : P>): FindCursor<P>;

	findByNames<P extends Document>(
		names: Array<string>,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P> | FindCursor<ITeam> {
		if (options === undefined) {
			return this.col.find({ name: { $in: names } });
		}
		return this.col.find({ name: { $in: names } }, options);
	}

	findByIds(ids: Array<string>, query?: Filter<ITeam>): FindCursor<ITeam>;

	findByIds(ids: Array<string>, options: FindOptions<ITeam>, query?: Filter<ITeam>): FindCursor<ITeam>;

	findByIds<P extends Document>(
		ids: Array<string>,
		options: FindOptions<P extends ITeam ? ITeam : P>,
		query?: Filter<ITeam>,
	): FindCursor<P>;

	findByIds<P extends Document>(
		ids: Array<string>,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
		query?: Filter<ITeam>,
	): FindCursor<P> | FindCursor<ITeam> {
		if (options === undefined) {
			return this.find({ ...query, _id: { $in: ids } });
		}

		return this.find({ ...query, _id: { $in: ids } }, options);
	}

	findByIdsPaginated(
		ids: Array<string>,
		options?: undefined | FindOptions<ITeam>,
		query?: Filter<ITeam>,
	): FindPaginated<FindCursor<ITeam>> {
		if (options === undefined) {
			return this.findPaginated({ ...query, _id: { $in: ids } });
		}

		return this.findPaginated({ ...query, _id: { $in: ids } }, options);
	}

	findByIdsAndType(ids: Array<string>, type: TEAM_TYPE): FindCursor<ITeam>;

	findByIdsAndType(ids: Array<string>, type: TEAM_TYPE, options: FindOptions<ITeam>): FindCursor<ITeam>;

	findByIdsAndType<P extends Document>(
		ids: Array<string>,
		type: TEAM_TYPE,
		options: FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P>;

	findByIdsAndType<P extends Document>(
		ids: Array<string>,
		type: TEAM_TYPE,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P> | FindCursor<ITeam> {
		if (options === undefined) {
			return this.col.find({ _id: { $in: ids }, type });
		}
		return this.col.find({ _id: { $in: ids }, type }, options);
	}

	findByType(type: number): FindCursor<ITeam>;

	findByType(type: number, options: FindOptions<ITeam>): FindCursor<ITeam>;

	findByType<P extends Document>(type: number, options: FindOptions<P extends ITeam ? ITeam : P>): FindCursor<P>;

	findByType<P extends Document>(
		type: number,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<ITeam> | FindCursor<P> {
		if (options === undefined) {
			return this.col.find({ type }, options);
		}
		return this.col.find({ type }, options);
	}

	findByNameAndTeamIds(name: string | RegExp, teamIds: Array<string>): FindCursor<ITeam>;

	findByNameAndTeamIds(name: string | RegExp, teamIds: Array<string>, options: FindOptions<ITeam>): FindCursor<ITeam>;

	findByNameAndTeamIds<P extends Document>(
		name: string | RegExp,
		teamIds: Array<string>,
		options: FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P>;

	findByNameAndTeamIds<P extends Document>(
		name: string | RegExp,
		teamIds: Array<string>,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): FindCursor<P> | FindCursor<ITeam> {
		if (options === undefined) {
			return this.col.find({
				name,
				$or: [
					{
						type: 0,
					},
					{
						_id: {
							$in: teamIds,
						},
					},
				],
			});
		}
		return this.col.find(
			{
				name,
				$or: [
					{
						type: 0,
					},
					{
						_id: {
							$in: teamIds,
						},
					},
				],
			},
			options,
		);
	}

	findOneByName(name: string | RegExp): Promise<ITeam | null>;

	findOneByName(name: string | RegExp, options: FindOptions<ITeam>): Promise<ITeam | null>;

	findOneByName<P extends Document>(name: string | RegExp, options: FindOptions<P>): Promise<P | null>;

	findOneByName<P extends Document>(
		name: string | RegExp,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): Promise<P | null> | Promise<ITeam | null> {
		if (options === undefined) {
			return this.col.findOne({ name });
		}
		return this.col.findOne({ name }, options);
	}

	findOneByMainRoomId(roomId: string): Promise<ITeam | null>;

	findOneByMainRoomId(roomId: string, options: FindOptions<ITeam>): Promise<ITeam | null>;

	findOneByMainRoomId<P extends Document>(roomId: string, options: FindOptions<P>): Promise<P | null>;

	findOneByMainRoomId<P extends Document>(
		roomId: string,
		options?: undefined | FindOptions<ITeam> | FindOptions<P extends ITeam ? ITeam : P>,
	): Promise<P | null> | Promise<ITeam | null> {
		return options ? this.col.findOne({ roomId }, options) : this.col.findOne({ roomId });
	}

	updateMainRoomForTeam(id: string, roomId: string): Promise<UpdateResult> {
		return this.updateOne(
			{
				_id: id,
			},
			{
				$set: {
					roomId,
				},
			},
		);
	}

	deleteOneById(id: string): Promise<DeleteResult> {
		return this.col.deleteOne({
			_id: id,
		});
	}

	deleteOneByName(name: string): Promise<DeleteResult> {
		return this.col.deleteOne({ name });
	}

	updateNameAndType(teamId: string, nameAndType: { name?: string; type?: TEAM_TYPE }): Promise<UpdateResult> {
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
