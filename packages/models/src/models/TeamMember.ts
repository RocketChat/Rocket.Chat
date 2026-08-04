import type { IRole, ITeamMember, IUser, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { FindPaginated, ITeamMemberModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
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

	protected override modelIndexes(): IndexDescription[] {
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

	findByUserId<P extends Document = ITeamMember, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(userId: string, options?: O): FindCursor<DocumentWithProjection<P, O>> {
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

	findByTeamId<P extends Document = ITeamMember, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(teamId: string, options?: O): FindCursor<DocumentWithProjection<P, O>> {
		return options ? this.col.find({ teamId }, options) : this.col.find({ teamId }, options);
	}

	countByTeamId(teamId: string): Promise<number> {
		return this.countDocuments({ teamId });
	}

	findByTeamIds<P extends Document = ITeamMember, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(teamIds: Array<string>, options?: O): FindCursor<DocumentWithProjection<P, O>> {
		return options ? this.col.find({ teamId: { $in: teamIds } }, options) : this.col.find({ teamId: { $in: teamIds } }, options);
	}

	countByTeamIdAndRole(teamId: string, role: IRole['_id']): Promise<number> {
		return this.countDocuments({ teamId, roles: role });
	}

	findByUserIdAndTeamIds<T extends Document = ITeamMember, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(userId: string, teamIds: Array<string>, options?: O): FindCursor<DocumentWithProjection<T, O>> {
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
