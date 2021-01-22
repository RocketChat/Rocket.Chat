import { IServiceClass } from './ServiceClass';
import { IMessage } from '../../../definition/IMessage';

export type MessageFilter = {
	rid: string;
	latest?: Date;
	oldest?: Date;
	excludeTypes?: string[];
	queryOptions?: any;
	inclusive?: boolean;
	snippeted?: boolean;
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
export interface IMessageService extends IServiceClass {
	get(userId: string, options: MessageFilter): Promise<{records: IMessage[]; total?: number} | undefined>;
	getDiscussions(options: DiscussionArgs): Promise<{records: IMessage[]; total?: number} | undefined>;
	customQuery({ query, userId, queryOptions }: CustomQueryArgs): Promise<{records: IMessage[]; total?: number} | undefined>;
	getUpdates({ rid, timestamp, queryOptions }: getUpdatesArgs): Promise<{records: IMessage[]; total?: number} | undefined>;
	getDeleted({ rid, userId, timestamp, query, queryOptions }: getDeletedArgs): Promise<{records: IMessage[]; total?: number} | undefined>;
	getFiles({ rid, userId, excludePinned, ignoreDiscussion, ignoreThreads, oldest, latest, inclusive, fromUsers, queryOptions }: getFilesArgs): Promise<{records: IMessage[]; total?: number} | undefined>;
	getThreadsByRoomId({ rid, userId, excludePinned, oldest, latest, inclusive, fromUsers, queryOptions }: getThreadsArgs): Promise<{records: IMessage[]; total?: number} | undefined>;
	getThreadById({ tmid, userId, queryOptions }: getThreadByIdArgs): Promise<{records: IMessage[]; total?: number} | undefined>;
}
