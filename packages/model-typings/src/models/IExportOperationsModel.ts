import type { Cursor, UpdateWriteOpResult } from 'mongodb';
import type { IExportOperation } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IExportOperationsModel extends IBaseModel<IExportOperation> {
	findOnePending(): Promise<IExportOperation | null>;
	create(data: IExportOperation): Promise<string>;
	findLastOperationByUser(userId: string, fullExport: boolean): Promise<IExportOperation | null>;
	findAllPendingBeforeMyRequest(requestDay: Date): Cursor<IExportOperation>;
	updateOperation(data: IExportOperation): Promise<UpdateWriteOpResult>;
}
