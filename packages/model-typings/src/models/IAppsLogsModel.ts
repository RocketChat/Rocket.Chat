import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';

import type { IBaseModel } from './IBaseModel';

export type IAppsLogsModel = IBaseModel<ILoggerStorageEntry>;
