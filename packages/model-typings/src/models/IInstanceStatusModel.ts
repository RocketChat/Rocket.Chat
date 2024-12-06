import type { IInstanceStatus } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';
import type { UpdateResult } from 'mongodb';

export interface IInstanceStatusModel extends IBaseModel<IInstanceStatus> {
	getActiveInstanceCount(): Promise<number>;
	getActiveInstancesAddress(): Promise<string[]>;
	setDocumentHeartbeat(documentId: string): Promise<UpdateResult>;
}
