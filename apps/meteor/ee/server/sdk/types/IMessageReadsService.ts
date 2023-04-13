export interface IMessageReadsService {
	readThread(userId: string, threadId: string): Promise<void>;
}
