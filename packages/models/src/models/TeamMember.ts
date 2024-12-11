import type { IRole, ITeamMember, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { FindPaginated, ITeamMemberModel } from '@rocket.chat/model-typings';
import type {
	Collection,
	FindCursor,
	Db,
	DeleteResult,
	Document,
	Filter,
	FindOptions,
	IndexDescription,
	InsertOneResult,
	UpdateResult,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class TeamMemberRaw extends BaseRaw<ITeamMember> implements ITeamMemberModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ITeamMember>>) {
		super(db, 'team_member', trash);
	}

	protected modelIndexes(): IndexDescription[] {
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

	findByUserId(userId: string): FindCursor<ITeamMember>;

	findByUserId(userId: string, options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByUserId<P extends Document>(userId: string, options: FindOptions<P>): FindCursor<P>;

	findByUserId<P extends Document>(
		userId: string,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember> {
		return options ? this.col.find({ userId }, options) : this.col.find({ userId }, options);
	}

	findOneByUserIdAndTeamId(userId: string, teamId: string): Promise<ITeamMember | null>;

	findOneByUserIdAndTeamId(userId: string, teamId: string, options: FindOptions<ITeamMember>): Promise<ITeamMember | null>;

	findOneByUserIdAndTeamId<P extends Document>(userId: string, teamId: string, options: FindOptions<P>): Promise<P | null>;

	findOneByUserIdAndTeamId<P extends Document>(
		userId: string,
		teamId: string,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): Promise<P | null | ITeamMember> {
		return options ? this.col.findOne({ userId, teamId }, options) : this.col.findOne({ userId, teamId }, options);
	}

	findByTeamId(teamId: string): FindCursor<ITeamMember>;

	findByTeamId(teamId: string, options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByTeamId<P extends Document>(teamId: string, options: FindOptions<P>): FindCursor<P>;

	findByTeamId<P extends Document>(
		teamId: string,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember> {
		return options ? this.col.find({ teamId }, options) : this.col.find({ teamId }, options);
	}

	countByTeamId(teamId: string): Promise<number> {
		return this.countDocuments({ teamId });
	}

	findByTeamIds(teamIds: Array<string>): FindCursor<ITeamMember>;

	findByTeamIds(teamIds: Array<string>, options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByTeamIds<P extends Document>(teamIds: Array<string>, options: FindOptions<P>): FindCursor<P>;

	findByTeamIds<P extends Document>(
		teamIds: Array<string>,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember> {
		return options ? this.col.find({ teamId: { $in: teamIds } }, options) : this.col.find({ teamId: { $in: teamIds } }, options);
	}

	findByTeamIdAndRole(teamId: string, role: IRole['_id']): FindCursor<ITeamMember>;

	findByTeamIdAndRole(teamId: string, role: IRole['_id'], options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByTeamIdAndRole<P extends Document>(teamId: string, role: IRole['_id'], options: FindOptions<P>): FindCursor<P>;

	findByTeamIdAndRole<P extends Document>(
		teamId: string,
		role: IRole['_id'],
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember> {
		return options ? this.col.find({ teamId, roles: role }, options) : this.col.find({ teamId, roles: role });
	}

	countByTeamIdAndRole(teamId: string, role: IRole['_id']): Promise<number> {
		return this.countDocuments({ teamId, roles: role });
	}

	findByUserIdAndTeamIds(userId: string, teamIds: Array<string>, options: FindOptions<ITeamMember> = {}): FindCursor<ITeamMember> {
		const query = {
			userId,
			teamId: {
				$in: teamIds,
			},
		};

		return this.col.find(query, options);
	}

	findPaginatedMembersInfoByTeamId(
		teamId: string,
		limit: number,
		skip: number,
		query?: Filter<ITeamMember>,
	): FindPaginated<FindCursor<ITeamMember>> {
		return this.findPaginated(
			{ ...query, teamId },
			{
				limit,
				skip,
				projection: {
					userId: 1,
					roles: 1,
					createdBy: 1,
					createdAt: 1,
				},
			},
		);
	}

	updateOneByUserIdAndTeamId(userId: string, teamId: string, update: Partial<ITeamMember>): Promise<UpdateResult> {
		return this.updateOne({ userId, teamId }, { $set: update });
	}

	createOneByTeamIdAndUserId(
		teamId: string,
		userId: string,
		createdBy: Pick<IUser, '_id' | 'username'>,
	): Promise<InsertOneResult<ITeamMember>> {
		return this.insertOne({
			teamId,
			userId,
			createdAt: new Date(),
			createdBy,
			_updatedAt: new Date(),
		});
	}

	updateRolesByTeamIdAndUserId(teamId: string, userId: string, roles: Array<IRole['_id']>): Promise<UpdateResult> {
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

	removeRolesByTeamIdAndUserId(teamId: string, userId: string, roles: Array<IRole['_id']>): Promise<UpdateResult> {
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

	deleteByUserIdAndTeamId(userId: string, teamId: string): Promise<DeleteResult> {
		return this.col.deleteOne({
			teamId,
			userId,
		});
	}

	deleteByTeamId(teamId: string): Promise<DeleteResult> {
		return this.col.deleteMany({
			teamId,
		});
	}
}
