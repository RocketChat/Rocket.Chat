import type { IPersistenceItem } from '@rocket.chat/apps-engine/definition/persistence';
import type { DeleteResult, Filter } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IAppsPersistenceModel extends IBaseModel<IPersistenceItem & { _id: string }> {
	remove(query: Filter<any>): Promise<DeleteResult>;
}
