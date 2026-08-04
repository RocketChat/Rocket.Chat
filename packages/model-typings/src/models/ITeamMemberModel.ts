import type { ITeamMember, IUser, IRole } from '@rocket.chat/core-typings';
import type { FindOptions, FindCursor, InsertOneResult, UpdateResult, DeleteResult, Filter, Document } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ITeamMemberModel extends IBaseModel<ITeamMember> {
	findByUserId<P extends Document = ITeamMember, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(userId: string, options?: O): FindCursor<DocumentWithProjection<P, O>>;

	findOneByUserIdAndTeamId(userId: string, teamId: string): Promise<ITeamMember | null>;

	findOneByUserIdAndTeamId(userId: string, teamId: string, options: FindOptions<ITeamMember>): Promise<ITeamMember | null>;

	findOneByUserIdAndTeamId<P extends Document>(userId: string, teamId: string, options: FindOptions<P>): Promise<P | null>;

	findOneByUserIdAndTeamId<P extends Document>(
		userId: string,
		teamId: string,
		options?: undefined | FindOptions<ITeamMember> | FindOptions<P extends ITeamMember ? ITeamMember : P>,
	): Promise<P | null | ITeamMember>;

	findByTeamId<P extends Document = ITeamMember, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(teamId: string, options?: O): FindCursor<DocumentWithProjection<P, O>>;

	countByTeamId(teamId: string): Promise<number>;
	findByTeamIds<P extends Document = ITeamMember, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(teamIds: Array<string>, options?: O): FindCursor<DocumentWithProjection<P, O>>;

	countByTeamIdAndRole(teamId: string, role: IRole['_id']): Promise<number>;

	findByUserIdAndTeamIds<T extends Document = ITeamMember, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(userId: string, teamIds: Array<string>, options?: O): FindCursor<DocumentWithProjection<T, O>>;

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
