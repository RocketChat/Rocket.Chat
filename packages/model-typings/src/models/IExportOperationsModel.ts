import type { IExportOperation } from '@rocket.chat/core-typings';
import type { UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IExportOperationsModel extends IBaseModel<IExportOperation> {
	findOnePending(): Promise<IExportOperation | null>;
	create(data: IExportOperation): Promise<string>;
	findLastOperationByUser(userId: string, fullExport: boolean): Promise<IExportOperation | null>;
	updateOperation(data: IExportOperation): Promise<UpdateResult>;
	countAllPendingBeforeMyRequest(requestDay: Date): Promise<number>;
}
