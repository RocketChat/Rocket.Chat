import type { IBaseModel } from './IBaseModel';

// TODO: type for AppLogs
export interface IAppLogsModel extends IBaseModel<any> {
	resetTTLIndex(expireAfterSeconds: number): Promise<void>;
}
