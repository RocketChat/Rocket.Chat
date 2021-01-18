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

export interface IMessageService extends IServiceClass {
	get(userId: string, options: MessageFilter): Promise<any[] | undefined>;
}
