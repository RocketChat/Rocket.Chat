import type { IBaseModel } from './IBaseModel';

// TODO: type for AppLogs
export interface IAppLogsModel extends IBaseModel<any> {
	getDistinctFieldsForFilters(appId: string): Promise<{ instanceIds: string[]; methods: string[] }>;
}
