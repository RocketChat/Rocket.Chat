import type { UpdateResult, FindOptions, FindCursor, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IImportsModel extends IBaseModel<any> {
	findLastImport(): Promise<any | undefined>;
	invalidateAllOperations(): Promise<UpdateResult | Document>;
	invalidateOperationsExceptId(id: string): Promise<UpdateResult | Document>;
	invalidateOperationsNotInStatus(status: string | string[]): Promise<UpdateResult | Document>;
	findAllPendingOperations(options: FindOptions<any>): FindCursor<any>;
}
