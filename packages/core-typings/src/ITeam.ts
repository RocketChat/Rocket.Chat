import type { FindOptions, Filter, SchemaMember } from 'mongodb';

import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRole } from './IRole';
import type { IUser } from './IUser';

export enum TEAM_TYPE {
	PUBLIC = 0,
	PRIVATE = 1,
}

export type SortType = -1 | 1;

export interface ITeam extends IRocketChatRecord {
	name: string;
	type: TEAM_TYPE;
	roomId: string;
	createdBy: Pick<IUser, '_id' | 'username'>;
	createdAt: Date;
}

export interface ITeamMember extends IRocketChatRecord {
	teamId: string;
	userId: string;
	roles?: Array<IRole['_id']>;
	createdBy: Pick<IUser, '_id' | 'username'>;
	createdAt: Date;
}

// TODO move this definition to a more broader file
export interface IPaginationOptions {
	offset: number;
	count: number;
}

// TODO move this definition to a more broader file
export interface IQueryOptions<T> {
	sort?: FindOptions<T>['sort'];
	query?: Filter<T>;
	fields?: SchemaMember<T, number | boolean>;
}

// TODO move this definition to a more broader file
export interface IRecordsWithTotal<T> {
	records: Array<T>;
	total: number;
}

export interface ITeamStats {
	totalTeams: number;
	totalRoomsInsideTeams: number;
	totalDefaultRoomsInsideTeams: number;
}

// TODO: move to service sdk package
export interface ITeamMemberParams {
	userId: string;
	roles?: Array<IRole['_id']> | null;
}
