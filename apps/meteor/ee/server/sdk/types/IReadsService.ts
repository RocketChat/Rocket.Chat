export interface IReadsService {
	readThread(userId: string, threadId: string): Promise<void>;
}
