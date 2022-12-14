export interface IQueueWorkerService {
	queueWork<T extends Record<string, unknown>>(to: string, data: T): Promise<void>;
}
