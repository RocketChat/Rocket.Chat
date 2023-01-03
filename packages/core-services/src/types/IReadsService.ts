import type { IServiceClass } from './ServiceClass';

export interface IReadsService extends IServiceClass {
	readThread(userId: string, threadId: string): Promise<void>;
}
