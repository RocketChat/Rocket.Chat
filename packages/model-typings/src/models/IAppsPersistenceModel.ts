import type { DeleteResult, Filter } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export type AppsPersistenceRecord = {
	_id: string;
	_updatedAt?: Date;
	appId: string;
	associations?: unknown[];
	data: object;
};

export interface IAppsPersistenceModel extends IBaseModel<AppsPersistenceRecord> {
	remove(query: Filter<AppsPersistenceRecord>): Promise<DeleteResult>;
}
