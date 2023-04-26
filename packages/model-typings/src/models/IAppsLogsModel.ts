import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';

import type { IBaseModel } from './IBaseModel';

export interface IAppsLogsModel extends IBaseModel<ILoggerStorageEntry> {
	resetTTLIndex(expireAfterSeconds: number): Promise<void>;
}
