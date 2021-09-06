import { SortOptionObject, FilterQuery, SchemaMember } from 'mongodb';

import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';

export enum TASKRoomType {
	PUBLIC = 0,
	PRIVATE = 1,
}

export type SortType = -1|1;

export interface ITaskRoom extends IRocketChatRecord {
	name: string;
	type: TASKRoomType;
	roomId: string;
	createdAt: Date;
	taskRoomId: string;
}

export interface ITaskRoomMember extends IRocketChatRecord {
	userId: string;
	roles?: Array<string>;
	createdBy: Pick<IUser, '_id' | 'username' >;
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
	taskRoomId: string;
	mainRoom: string;
	totalRooms: number;
	totalMessages: number;
	totalPublicRooms: number;
	totalPrivateRooms: number;
	totalDefaultRooms: number;
	totalMembers: number;
}
export interface ITeamStats {
	totalTaskRoom: number;
	teamTaskRoom: Array<ITeamStatData>;
}
