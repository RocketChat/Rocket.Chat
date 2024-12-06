import type { IInstanceStatus } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IInstanceStatusModel extends IBaseModel<IInstanceStatus> {
	getActiveInstanceCount(): Promise<number>;
	getActiveInstancesAddress(): Promise<string[]>;
	setDocumentHeartbeat(documentId: string): Promise<UpdateResult>;
}
