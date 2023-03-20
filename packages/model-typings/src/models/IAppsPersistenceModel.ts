import type { IPersistenceItem } from '@rocket.chat/core-typings';
import type { DeleteResult, Filter } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IAppsPersistenceModel extends IBaseModel<IPersistenceItem> {
	remove(query: Filter<any>): Promise<DeleteResult>;
}
