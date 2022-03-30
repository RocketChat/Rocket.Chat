import { SortOptionObject, FilterQuery, SchemaMember } from 'mongodb';

import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser, IRole } from './IUser';

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
	sort?: SortOptionObject<T>;
	query?: FilterQuery<T>;
	fields?: SchemaMember<T, number | boolean>;
}

// TODO move this definition to a more broader file
export interface IRecordsWithTotal<T> {
	records: Array<T>;
	total: number;
}

export interface ITeamStatData {
	teamId: string;
	mainRoom: string;
	totalRooms: number;
	totalMessages: number;
	totalPublicRooms: number;
	totalPrivateRooms: number;
	totalDefaultRooms: number;
	totalMembers: number;
}
export interface ITeamStats {
	totalTeams: number;
	teamStats: Array<ITeamStatData>;
}
