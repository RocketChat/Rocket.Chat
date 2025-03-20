export type HealthAggResult = {
	total: number;
	type: string;
	status: 'Rejected' | 'In progress';
};

type Actions = 'work' | 'workComplete';

export interface IQueueWorkerService {
	queueWork<T extends Record<string, unknown>>(queue: Actions, to: string, data: T): Promise<void>;
	queueInfo(): Promise<HealthAggResult[]>;
}
