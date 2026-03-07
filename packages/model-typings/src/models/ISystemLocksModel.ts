import type { ISystemLock } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ISystemLockResult {
	acquired: boolean;
	record?: ISystemLock;
}

export interface ISystemLocksModel extends IBaseModel<ISystemLock> {
	acquireLock(key: string, staleLockThresholdMinutes?: number): Promise<ISystemLockResult>;
	releaseLock(key: string, extraData?: Record<string, unknown>): Promise<void>;
}
