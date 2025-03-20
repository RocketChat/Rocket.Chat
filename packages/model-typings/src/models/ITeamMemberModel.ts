import type { ITeamMember, IUser, IRole } from '@rocket.chat/core-typings';
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

	findOneByUserIdAndTeamId(userId: string, teamId: string): Promise<ITeamMember | null>;

	findOneByUserIdAndTeamId(userId: string, teamId: string, options: FindOptions<ITeamMember>): Promise<ITeamMember | null>;

	findOneByUserIdAndTeamId<P extends Document>(userId: string, teamId: string, options: FindOptions<P>): Promise<P | null>;

	findOneByUserIdAndTeamId<P extends Document>(
		userId: string,
		teamId: string,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): Promise<P | null | ITeamMember>;

	findByTeamId(teamId: string): FindCursor<ITeamMember>;

	findByTeamId(teamId: string, options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByTeamId<P extends Document>(teamId: string, options: FindOptions<P>): FindCursor<P>;

	findByTeamId<P extends Document>(
		teamId: string,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember>;

	countByTeamId(teamId: string): Promise<number>;
	findByTeamIds(teamIds: Array<string>): FindCursor<ITeamMember>;

	findByTeamIds(teamIds: Array<string>, options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByTeamIds<P extends Document>(teamIds: Array<string>, options: FindOptions<P>): FindCursor<P>;

	findByTeamIds<P extends Document>(
		teamIds: Array<string>,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember>;

	findByTeamIdAndRole(teamId: string, role: IRole['_id']): FindCursor<ITeamMember>;

	findByTeamIdAndRole(teamId: string, role: IRole['_id'], options: FindOptions<ITeamMember>): FindCursor<ITeamMember>;

	findByTeamIdAndRole<P extends Document>(teamId: string, role: IRole['_id'], options: FindOptions<P>): FindCursor<P>;

	findByTeamIdAndRole<P extends Document>(
		teamId: string,
		role: IRole['_id'],
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): FindCursor<P> | FindCursor<ITeamMember>;

	countByTeamIdAndRole(teamId: string, role: IRole['_id']): Promise<number>;

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
