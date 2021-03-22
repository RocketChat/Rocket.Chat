import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';

export enum TEAM_TYPE {
	PUBLIC = 0,
	PRIVATE = 1,
}

export interface ITeam extends IRocketChatRecord {
	name: string;
	type: TEAM_TYPE;
	roomId: string;
	createdBy: Pick<IUser, '_id' | 'username' >;
	createdAt: Date;
}

export interface ITeamMember extends IRocketChatRecord {
	teamId: string;
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
export interface IRecordsWithTotal<T> {
	records: Array<T>;
	total: number;
}
