import type { IImport } from '@rocket.chat/core-typings';
import type { UpdateResult, FindOptions, FindCursor, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IImportsModel extends IBaseModel<IImport> {
	findLastImport(): Promise<IImport | undefined>;
	hasValidOperationInStatus(allowedStatus: IImport['status'][]): Promise<boolean>;
	invalidateAllOperations(): Promise<UpdateResult | Document>;
	invalidateOperationsExceptId(id: string): Promise<UpdateResult | Document>;
	findAllPendingOperations(options: FindOptions<IImport>): FindCursor<IImport>;
	increaseTotalCount(id: string, recordType: 'users' | 'channels' | 'messages', increaseBy?: number): Promise<UpdateResult>;
	setOperationStatus(id: string, status: IImport['status']): Promise<UpdateResult>;
}
