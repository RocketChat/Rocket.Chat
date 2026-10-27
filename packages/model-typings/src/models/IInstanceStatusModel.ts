import type { IInstanceStatus } from '@rocket.chat/core-typings';
import type { ChangeStream, DeleteResult, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IInstanceStatusModel extends IBaseModel<IInstanceStatus> {
	watchActiveInstances(): ChangeStream<IInstanceStatus>;
	removeInstanceById(_id: IInstanceStatus['_id']): Promise<DeleteResult>;
	setDocumentHeartbeat(documentId: string): Promise<UpdateResult>;
	upsertInstance(instance: Partial<IInstanceStatus>): Promise<IInstanceStatus | null>;
	updateConnections(_id: IInstanceStatus['_id'], conns: number): Promise<UpdateResult>;
}
