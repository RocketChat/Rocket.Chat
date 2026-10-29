import type { IImport } from '@rocket.chat/core-typings';
import type { UpdateResult, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IImportsModel extends IBaseModel<IImport> {
	findLastImport(): Promise<IImport | undefined>;
	invalidateAllOperations(): Promise<UpdateResult | Document>;
	invalidateOperationsExceptId(id: string): Promise<UpdateResult | Document>;
	increaseTotalCount(id: string, recordType: 'users' | 'channels' | 'messages', increaseBy?: number): Promise<UpdateResult>;
	setOperationStatus(id: string, status: IImport['status']): Promise<UpdateResult>;
}
