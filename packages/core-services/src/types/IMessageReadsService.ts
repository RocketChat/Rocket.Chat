import type { IServiceClass } from './ServiceClass';

export interface IMessageReadsService extends IServiceClass {
	readThread(userId: string, threadId: string): Promise<void>;
}
