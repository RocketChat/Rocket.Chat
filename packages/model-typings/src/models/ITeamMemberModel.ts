import type { FindOptions, FindCursor, InsertOneResult, UpdateResult, DeleteResult, Filter } from 'mongodb';
import type { ITeamMember, IUser, IRole } from '@rocket.chat/core-typings';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface ITeamMemberModel extends IBaseModel<ITeamMember> {
	findByUserId(userId: string): FindCursor<ITeamMember>;

	findByUserId(userId: string, options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByUserId<P>(userId: string, options: FindOptions<P>): FindCursor<P>;

	findByUserId<P>(
		userId: string,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember>;

	findOneByUserIdAndTeamId(userId: string, teamId: string): Promise<ITeamMember | null>;

	findOneByUserIdAndTeamId(userId: string, teamId: string, options: FindOptions<ITeamMember>): Promise<ITeamMember | null>;

	findOneByUserIdAndTeamId<P>(userId: string, teamId: string, options: FindOptions<P>): Promise<P | null>;

	findOneByUserIdAndTeamId<P>(
		userId: string,
		teamId: string,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): Promise<P | null | ITeamMember>;

	findByTeamId(teamId: string): FindCursor<ITeamMember>;

	findByTeamId(teamId: string, options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByTeamId<P>(teamId: string, options: FindOptions<P>): FindCursor<P>;

	findByTeamId<P>(
		teamId: string,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember>;

	findByTeamIds(teamIds: Array<string>): FindCursor<ITeamMember>;

	findByTeamIds(teamIds: Array<string>, options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByTeamIds<P>(teamIds: Array<string>, options: FindOptions<P>): FindCursor<P>;

	findByTeamIds<P>(
		teamIds: Array<string>,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember>;

	findByTeamIdAndRole(teamId: string, role: IRole['_id']): FindCursor<ITeamMember>;

	findByTeamIdAndRole(teamId: string, role: IRole['_id'], options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByTeamIdAndRole<P>(teamId: string, role: IRole['_id'], options: FindOptions<P>): FindCursor<P>;

	findByTeamIdAndRole<P>(
		teamId: string,
		role: IRole['_id'],
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember>;

	findByUserIdAndTeamIds(userId: string, teamIds: Array<string>, options?: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findPaginatedMembersInfoByTeamId(
		teamId: string,
		limit: number,
		skip: number,
		query?: Filter<ITeamMember>,
	): FindPaginated<FindCursor<ITeamMember>>;

	updateOneByUserIdAndTeamId(userId: string, teamId: string, update: Partial<ITeamMember>): Promise<UpdateResult>;
	createOneByTeamIdAndUserId(
		teamId: string,
		userId: string,
		createdBy: Pick<IUser, '_id' | 'username'>,
	): Promise<InsertOneResult<ITeamMember>>;

	updateRolesByTeamIdAndUserId(teamId: string, userId: string, roles: Array<IRole['_id']>): Promise<UpdateResult>;

	removeRolesByTeamIdAndUserId(teamId: string, userId: string, roles: Array<IRole['_id']>): Promise<UpdateResult>;

	deleteByUserIdAndTeamId(userId: string, teamId: string): Promise<DeleteResult>;
	deleteByTeamId(teamId: string): Promise<DeleteResult>;
}
