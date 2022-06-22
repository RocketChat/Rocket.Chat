import type {
	WithoutProjection,
	FindOneOptions,
	Cursor,
	InsertOneWriteOpResult,
	UpdateWriteOpResult,
	DeleteWriteOpResultObject,
	FilterQuery,
} from 'mongodb';
import type { ITeamMember, IUser, IRole } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ITeamMemberModel extends IBaseModel<ITeamMember> {
	findByUserId(userId: string): Cursor<ITeamMember>;

	findByUserId(userId: string, options: WithoutProjection<FindOneOptions<ITeamMember>>): Cursor<ITeamMember>;

	findByUserId<P>(userId: string, options: FindOneOptions<P>): Cursor<P>;

	findByUserId<P>(
		userId: string,
		options?: undefined | WithoutProjection<FindOneOptions<ITeamMember>> | FindOneOptions<P extends ITeamMember ? ITeamMember : P>,
	): Cursor<P> | Cursor<ITeamMember>;

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
	): Promise<P | null | ITeamMember>;

	findByTeamId(teamId: string): Cursor<ITeamMember>;

	findByTeamId(teamId: string, options: WithoutProjection<FindOneOptions<ITeamMember>>): Cursor<ITeamMember>;

	findByTeamId<P>(teamId: string, options: FindOneOptions<P>): Cursor<P>;

	findByTeamId<P>(
		teamId: string,
		options?: undefined | WithoutProjection<FindOneOptions<ITeamMember>> | FindOneOptions<P extends ITeamMember ? ITeamMember : P>,
	): Cursor<P> | Cursor<ITeamMember>;

	findByTeamIds(teamIds: Array<string>): Cursor<ITeamMember>;

	findByTeamIds(teamIds: Array<string>, options: WithoutProjection<FindOneOptions<ITeamMember>>): Cursor<ITeamMember>;

	findByTeamIds<P>(teamIds: Array<string>, options: FindOneOptions<P>): Cursor<P>;

	findByTeamIds<P>(
		teamIds: Array<string>,
		options?: undefined | WithoutProjection<FindOneOptions<ITeamMember>> | FindOneOptions<P extends ITeamMember ? ITeamMember : P>,
	): Cursor<P> | Cursor<ITeamMember>;

	findByTeamIdAndRole(teamId: string, role: IRole['_id']): Cursor<ITeamMember>;

	findByTeamIdAndRole(teamId: string, role: IRole['_id'], options: WithoutProjection<FindOneOptions<ITeamMember>>): Cursor<ITeamMember>;

	findByTeamIdAndRole<P>(teamId: string, role: IRole['_id'], options: FindOneOptions<P>): Cursor<P>;

	findByTeamIdAndRole<P>(
		teamId: string,
		role: IRole['_id'],
		options?: undefined | WithoutProjection<FindOneOptions<ITeamMember>> | FindOneOptions<P extends ITeamMember ? ITeamMember : P>,
	): Cursor<P> | Cursor<ITeamMember>;

	findByUserIdAndTeamIds(userId: string, teamIds: Array<string>, options?: FindOneOptions<ITeamMember>): Cursor<ITeamMember>;
	findMembersInfoByTeamId(teamId: string, limit: number, skip: number, query?: FilterQuery<ITeamMember>): Cursor<ITeamMember>;

	updateOneByUserIdAndTeamId(userId: string, teamId: string, update: Partial<ITeamMember>): Promise<UpdateWriteOpResult>;
	createOneByTeamIdAndUserId(
		teamId: string,
		userId: string,
		createdBy: Pick<IUser, '_id' | 'username'>,
	): Promise<InsertOneWriteOpResult<ITeamMember>>;

	updateRolesByTeamIdAndUserId(teamId: string, userId: string, roles: Array<IRole['_id']>): Promise<UpdateWriteOpResult>;

	removeRolesByTeamIdAndUserId(teamId: string, userId: string, roles: Array<IRole['_id']>): Promise<UpdateWriteOpResult>;

	deleteByUserIdAndTeamId(userId: string, teamId: string): Promise<DeleteWriteOpResultObject>;
	deleteByTeamId(teamId: string): Promise<DeleteWriteOpResultObject>;
}
