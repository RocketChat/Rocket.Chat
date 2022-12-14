export type HealthAggResult = {
	total: number;
	type: string;
	status: 'Rejected' | 'In progress';
};

export interface IQueueWorkerService {
	queueWork<T extends Record<string, unknown>>(to: string, data: T): Promise<void>;
	queueInfo(): Promise<HealthAggResult[]>;
}
