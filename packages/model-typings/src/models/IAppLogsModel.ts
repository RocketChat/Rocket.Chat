import type { DeleteResult, Filter } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

// TODO: type for AppLogs
export interface IAppLogsModel extends IBaseModel<any> {
	remove(query: Filter<any>): Promise<DeleteResult>;
}
