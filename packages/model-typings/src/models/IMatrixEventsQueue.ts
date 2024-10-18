import type { DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMatrixEventsQueueModel extends IBaseModel<any> {
	enqueue(events: any[]): Promise<void>;
	dequeue(event: any): Promise<DeleteResult>;
	findPending(): Promise<any[]>;
}
