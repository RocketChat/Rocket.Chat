import { IServiceClass } from './ServiceClass';

export type MessageFilter = {
	rid: string;
	latest?: Date;
	oldest?: Date;
	excludeTypes?: string[];
	queryOptions?: any;
	inclusive?: boolean;
	mentionsUsername?: string;
};

export type DiscussionArgs = {
	rid: string;
	excludePinned?: boolean;
	ignoreThreads?: boolean;
	inclusive?: boolean;
	fromUsers?: string[];
	oldest?: Date;
	latest?: Date;
	text?: string;
	queryOptions?: any;
	userId: string;
};

export type CustomQueryArgs = {
	query: any;
	queryOptions?: any;
	userId: string;
};

export type getUpdatesArgs = {
	rid: string;
	userId: string;
	timestamp: Date;
	queryOptions?: any;
};

export type getDeletedArgs = {
	rid: string;
	timestamp: Date;
	query: any;
	queryOptions: any;
	userId: string;
};

export type getFilesArgs = {
	rid: string;
	userId: string;
	excludePinned?: boolean;
	ignoreDiscussion?: boolean;
	ignoreThreads?: boolean;
	oldest?: Date;
	latest?: Date;
	inclusive?: boolean;
	fromUsers?: string[];
	queryOptions: any;
};

export type getThreadsArgs = {
	rid: string;
	userId: string;
	excludePinned?: boolean;
	oldest?: Date;
	latest?: Date;
	inclusive?: boolean;
	fromUsers?: string[];
	queryOptions: any;
};

export type getThreadByIdArgs = {
	tmid: string;
	userId: string;
	queryOptions: any;
}

export type getByIdArgs = {
	msgId: string;
	userId: string;
};

export interface IMessageService extends IServiceClass {
	get(userId: string, options: MessageFilter): Promise<any[] | undefined>;
	getDiscussions(options: DiscussionArgs): Promise<any[] | undefined>;
	customQuery(args: CustomQueryArgs): Promise<any[] | undefined>;
	getUpdates({ rid, timestamp, queryOptions }: getUpdatesArgs): Promise<any[] | undefined>;
	getDeleted({ rid, userId, timestamp, query, queryOptions }: getDeletedArgs): Promise<any[] | undefined>;
	getFiles({ rid, userId, excludePinned, ignoreDiscussion, ignoreThreads, oldest, latest, inclusive, fromUsers, queryOptions }: getFilesArgs): Promise<any[] | undefined>;
	getThreadsByRoomId({ rid, userId, excludePinned, oldest, latest, inclusive, fromUsers, queryOptions }: getThreadsArgs): Promise<any[] | undefined>;
	getThreadById({ tmid, userId, queryOptions }: getThreadByIdArgs): Promise<any[] | undefined>;
	getById({ msgId, userId }: getByIdArgs): Promise<any[] | undefined>;
}
