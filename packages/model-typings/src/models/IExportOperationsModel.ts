import type { FindCursor, UpdateResult } from 'mongodb';
import type { IExportOperation } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IExportOperationsModel extends IBaseModel<IExportOperation> {
	findOnePending(): Promise<IExportOperation | null>;
	create(data: IExportOperation): Promise<string>;
	findLastOperationByUser(userId: string, fullExport: boolean): Promise<IExportOperation | null>;
	findAllPendingBeforeMyRequest(requestDay: Date): FindCursor<IExportOperation>;
	updateOperation(data: IExportOperation): Promise<UpdateResult>;
}
