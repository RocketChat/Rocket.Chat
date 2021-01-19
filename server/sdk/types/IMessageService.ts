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
	text?: string;
	queryOptions?: any;
	userId: string;
}

export type CustomQueryArgs = {
	query: any;
	queryOptions: any;
	userId: string;
}

export interface IMessageService extends IServiceClass {
	get(userId: string, options: MessageFilter): Promise<any[] | undefined>;
	getDiscussions(options: DiscussionArgs): Promise<any[] | undefined>;
	customQuery(args: CustomQueryArgs): Promise<any[] | undefined>;
}
