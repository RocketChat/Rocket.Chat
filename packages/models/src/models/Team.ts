import type { ITeam, RocketChatRecordDeleted, TeamType } from '@rocket.chat/core-typings';
import type { FindPaginated, ITeamModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, DeleteResult, Document, Filter, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class TeamRaw extends BaseRaw<ITeam> implements ITeamModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ITeam>>) {
		super(db, 'team', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { name: 1 }, unique: true }];
	}

	findByNames<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(names: Array<string>, options?: O): FindCursor<DocumentWithProjection<P, O>> {
		if (options === undefined) {
			return this.col.find({ name: { $in: names } });
		}
		return this.col.find({ name: { $in: names } }, options);
	}

	findByIds<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(ids: Array<string>, options?: O, query?: Filter<ITeam>): FindCursor<DocumentWithProjection<P, O>> {
		if (options === undefined) {
			return this.find<P, O>({ ...query, _id: { $in: ids } });
		}

		return this.find<P, O>({ ...query, _id: { $in: ids } }, options);
	}

	findByIdsPaginated<T extends Document = ITeam, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(ids: Array<string>, options?: O, query?: Filter<ITeam>): FindPaginated<FindCursor<DocumentWithProjection<T, O>>> {
		if (options === undefined) {
			return this.findPaginated<T, O>({ ...query, _id: { $in: ids } });
		}

		return this.findPaginated<T, O>({ ...query, _id: { $in: ids } }, options);
	}

	findByIdsAndType<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(ids: Array<string>, type: TeamType, options?: O): FindCursor<DocumentWithProjection<P, O>> {
		if (options === undefined) {
			return this.col.find({ _id: { $in: ids }, type });
		}
		return this.col.find({ _id: { $in: ids }, type }, options);
	}

	findByType<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(type: number, options?: O): FindCursor<DocumentWithProjection<P, O>> {
		if (options === undefined) {
			return this.col.find({ type }, options);
		}
		return this.col.find({ type }, options);
	}

	findByNameAndTeamIds<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(name: string | RegExp, teamIds: Array<string>, options?: O): FindCursor<DocumentWithProjection<P, O>> {
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

	findOneByName<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(name: string | RegExp, options?: O): Promise<DocumentWithProjection<P, O> | null> {
		if (options === undefined) {
			return this.col.findOne({ name });
		}
		return this.col.findOne({ name }, options);
	}

	findOneByMainRoomId<P extends Document = ITeam, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(roomId: string, options?: O): Promise<DocumentWithProjection<P, O> | null> {
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

	updateNameAndType(teamId: string, nameAndType: { name?: string; type?: TeamType }): Promise<UpdateResult> {
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
