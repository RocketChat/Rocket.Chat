export interface IQueueWorkerService {
	getConfig(): unknown;
	queueWork<T extends Record<string, unknown>>(to: string, data: T): Promise<void>;
}
