import { IServiceClass } from './ServiceClass';

export type MessageFilter = {
	rid: string;
	latest?: Date;
	oldest?: Date;
	notContainingTypes?: string[];
	queryOptions?: any;
	inclusive?: boolean;
};

export interface IMessageService extends IServiceClass {
	get(userId: string, options: MessageFilter): Promise<any[]>;
}
