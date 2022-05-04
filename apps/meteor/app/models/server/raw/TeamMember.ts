import {
	WithoutProjection,
	FindOneOptions,
	Cursor,
	InsertOneWriteOpResult,
	UpdateWriteOpResult,
	DeleteWriteOpResultObject,
	FilterQuery,
} from 'mongodb';
import type { ITeamMember, IUser, IRole } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

type T = ITeamMember;
export class TeamMemberRaw extends BaseRaw<T> {
	protected modelIndexes(): IndexSpecification[] {
		return [
			{
				key: { teamId: 1 },
			},
			{
				key: { teamId: 1, userId: 1 },
				unique: true,
			},
		];
	}

	findByUserId(userId: string): Cursor<ITeamMember>;

	findByUserId(userId: string, options: WithoutProjection<FindOneOptions<ITeamMember>>): Cursor<ITeamMember>;

	findByUserId<P>(userId: string, options: FindOneOptions<P>): Cursor<P>;

	findByUserId<P>(
		userId: string,
		options?: undefined | WithoutProjection<FindOneOptions<ITeamMember>> | FindOneOptions<P extends ITeamMember ? ITeamMember : P>,
	): Cursor<P> | Cursor<ITeamMember> {
		return options ? this.col.find({ userId }, options) : this.col.find({ userId }, options);
	}

	findOneByUserIdAndTeamId(userId: string, teamId: string): Promise<ITeamMember | null>;

	findOneByUserIdAndTeamId(
		userId: string,
		teamId: string,
		options: WithoutProjection<FindOneOptions<ITeamMember>>,
	): Promise<ITeamMember | null>;

	findOneByUserIdAndTeamId<P>(userId: string, teamId: string, options: FindOneOptions<P>): Promise<P | null>;

	findOneByUserIdAndTeamId<P>(
		userId: string,
		teamId: string,
		options?: undefined | WithoutProjection<FindOneOptions<ITeamMember>> | FindOneOptions<P extends ITeamMember ? ITeamMember : P>,
	): Promise<P | null | ITeamMember> {
		return options ? this.col.findOne({ userId, teamId }, options) : this.col.findOne({ userId, teamId }, options);
	}

	findByTeamId(teamId: string): Cursor<ITeamMember>;

	findByTeamId(teamId: string, options: WithoutProjection<FindOneOptions<ITeamMember>>): Cursor<ITeamMember>;

	findByTeamId<P>(teamId: string, options: FindOneOptions<P>): Cursor<P>;

	findByTeamId<P>(
		teamId: string,
		options?: undefined | WithoutProjection<FindOneOptions<ITeamMember>> | FindOneOptions<P extends ITeamMember ? ITeamMember : P>,
	): Cursor<P> | Cursor<ITeamMember> {
		return options ? this.col.find({ teamId }, options) : this.col.find({ teamId }, options);
	}

	findByTeamIds(teamIds: Array<string>): Cursor<ITeamMember>;

	findByTeamIds(teamIds: Array<string>, options: WithoutProjection<FindOneOptions<ITeamMember>>): Cursor<ITeamMember>;

	findByTeamIds<P>(teamIds: Array<string>, options: FindOneOptions<P>): Cursor<P>;

	findByTeamIds<P>(
		teamIds: Array<string>,
		options?: undefined | WithoutProjection<FindOneOptions<ITeamMember>> | FindOneOptions<P extends ITeamMember ? ITeamMember : P>,
	): Cursor<P> | Cursor<ITeamMember> {
		return options ? this.col.find({ teamId: { $in: teamIds } }, options) : this.col.find({ teamId: { $in: teamIds } }, options);
	}

	findByTeamIdAndRole(teamId: string, role: IRole['_id']): Cursor<ITeamMember>;

	findByTeamIdAndRole(teamId: string, role: IRole['_id'], options: WithoutProjection<FindOneOptions<ITeamMember>>): Cursor<ITeamMember>;

	findByTeamIdAndRole<P>(teamId: string, role: IRole['_id'], options: FindOneOptions<P>): Cursor<P>;

	findByTeamIdAndRole<P>(
		teamId: string,
		role: IRole['_id'],
		options?: undefined | WithoutProjection<FindOneOptions<ITeamMember>> | FindOneOptions<P extends ITeamMember ? ITeamMember : P>,
	): Cursor<P> | Cursor<ITeamMember> {
		return options ? this.col.find({ teamId, roles: role }, options) : this.col.find({ teamId, roles: role });
	}

	findByUserIdAndTeamIds(userId: string, teamIds: Array<string>, options: FindOneOptions<T> = {}): Cursor<T> {
		const query = {
			userId,
			teamId: {
				$in: teamIds,
			},
		};

		return this.col.find(query, options);
	}

	findMembersInfoByTeamId(teamId: string, limit: number, skip: number, query?: FilterQuery<T>): Cursor<T> {
		return this.col.find({ ...query, teamId }, {
			limit,
			skip,
			projection: {
				userId: 1,
				roles: 1,
				createdBy: 1,
				createdAt: 1,
			},
		} as FindOneOptions<T>);
	}

	updateOneByUserIdAndTeamId(userId: string, teamId: string, update: Partial<T>): Promise<UpdateWriteOpResult> {
		return this.updateOne({ userId, teamId }, { $set: update });
	}

	createOneByTeamIdAndUserId(
		teamId: string,
		userId: string,
		createdBy: Pick<IUser, '_id' | 'username'>,
	): Promise<InsertOneWriteOpResult<T>> {
		return this.insertOne({
			teamId,
			userId,
			createdAt: new Date(),
			createdBy,
		});
	}

	updateRolesByTeamIdAndUserId(teamId: string, userId: string, roles: Array<IRole['_id']>): Promise<UpdateWriteOpResult> {
		return this.updateOne(
			{
				teamId,
				userId,
			},
			{
				$addToSet: {
					roles: { $each: roles },
				},
			},
		);
	}

	removeRolesByTeamIdAndUserId(teamId: string, userId: string, roles: Array<IRole['_id']>): Promise<UpdateWriteOpResult> {
		return this.updateOne(
			{
				teamId,
				userId,
			},
			{
				$pull: {
					roles: { $in: roles },
				},
			},
		);
	}

	deleteByUserIdAndTeamId(userId: string, teamId: string): Promise<DeleteWriteOpResultObject> {
		return this.col.deleteOne({
			teamId,
			userId,
		});
	}

	deleteByTeamId(teamId: string): Promise<DeleteWriteOpResultObject> {
		return this.col.deleteMany({
			teamId,
		});
	}
}
