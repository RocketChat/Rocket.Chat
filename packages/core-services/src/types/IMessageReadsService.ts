import type { IServiceClass } from './ServiceClass.js';

export interface IMessageReadsService extends IServiceClass {
	readThread(userId: string, threadId: string): Promise<void>;
}
