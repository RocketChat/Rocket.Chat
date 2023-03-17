import type { ILoggerStorageEntry } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IAppsLogsModel extends IBaseModel<ILoggerStorageEntry> {
	resetTTLIndex(expireAfterSeconds: number): Promise<void>;
}
