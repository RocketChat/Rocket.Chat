import type { ITeamMember, IUser, IRole, ITeam } from '@rocket.chat/core-typings';
import type { FindOptions, FindCursor, InsertOneResult, UpdateResult, DeleteResult, Filter, Document } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface ITeamMemberModel extends IBaseModel<ITeamMember> {
	findByUserId(userId: string): FindCursor<ITeamMember>;

	findByUserId(userId: string, options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByUserId<P extends Document>(userId: string, options: FindOptions<P>): FindCursor<P>;

	findByUserId<P extends Document>(
		userId: string,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember>;

	findOneByUserIdAndTeamId(userId: string, teamId: ITeam['_id']): Promise<ITeamMember | null>;

	findOneByUserIdAndTeamId(userId: string, teamId: ITeam['_id'], options: FindOptions<ITeamMember>): Promise<ITeamMember | null>;

	findOneByUserIdAndTeamId<P extends Document>(userId: string, teamId: ITeam['_id'], options: FindOptions<P>): Promise<P | null>;

	findOneByUserIdAndTeamId<P extends Document>(
		userId: string,
		teamId: ITeam['_id'],
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): Promise<P | null | ITeamMember>;

	findByTeamId(teamId: ITeam['_id']): FindCursor<ITeamMember>;

	findByTeamId(teamId: ITeam['_id'], options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByTeamId<P extends Document>(teamId: ITeam['_id'], options: FindOptions<P>): FindCursor<P>;

	findByTeamId<P extends Document>(
		teamId: ITeam['_id'],
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember>;

	countByTeamId(teamId: ITeam['_id']): Promise<number>;
	findByTeamIds(teamIds: Array<ITeam['_id']>): FindCursor<ITeamMember>;

	findByTeamIds(teamIds: Array<ITeam['_id']>, options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByTeamIds<P extends Document>(teamIds: Array<ITeam['_id']>, options: FindOptions<P>): FindCursor<P>;

	findByTeamIds<P extends Document>(
		teamIds: Array<ITeam['_id']>,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember>;

	findByTeamIdAndRole(teamId: ITeam['_id'], role: IRole['_id']): FindCursor<ITeamMember>;

	findByTeamIdAndRole(teamId: ITeam['_id'], role: IRole['_id'], options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByTeamIdAndRole<P extends Document>(teamId: ITeam['_id'], role: IRole['_id'], options: FindOptions<P>): FindCursor<P>;

	findByTeamIdAndRole<P extends Document>(
		teamId: ITeam['_id'],
		role: IRole['_id'],
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember>;

	countByTeamIdAndRole(teamId: ITeam['_id'], role: IRole['_id']): Promise<number>;

	findByUserIdAndTeamIds(userId: string, teamIds: Array<ITeam['_id']>, options?: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findPaginatedMembersInfoByTeamId(
		teamId: ITeam['_id'],
		limit: number,
		skip: number,
		query?: Filter<ITeamMember>,
	): FindPaginated<FindCursor<ITeamMember>>;

	updateOneByUserIdAndTeamId(userId: string, teamId: ITeam['_id'], update: Partial<ITeamMember>): Promise<UpdateResult>;
	createOneByTeamIdAndUserId(
		teamId: ITeam['_id'],
		userId: string,
		createdBy: Pick<IUser, '_id' | 'username'>,
	): Promise<InsertOneResult<ITeamMember>>;

	updateRolesByTeamIdAndUserId(teamId: ITeam['_id'], userId: string, roles: Array<IRole['_id']>): Promise<UpdateResult>;

	removeRolesByTeamIdAndUserId(teamId: ITeam['_id'], userId: string, roles: Array<IRole['_id']>): Promise<UpdateResult>;

	deleteByUserIdAndTeamId(userId: string, teamId: ITeam['_id']): Promise<DeleteResult>;
	deleteByTeamId(teamId: ITeam['_id']): Promise<DeleteResult>;
}
