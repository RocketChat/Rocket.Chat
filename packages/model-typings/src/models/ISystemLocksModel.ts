import type { ISystemLock } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ISystemLockResult {
	acquired: boolean;
	record?: ISystemLock;
}

export interface ISystemLocksModel extends IBaseModel<ISystemLock> {
	acquireLock(key: string, staleLockThresholdMinutes?: number): Promise<ISystemLockResult>;
	renewLockThreshold(key: string, lockKey: string): Promise<void>;
	releaseLock(key: string, lockKey: string, extraData?: Record<string, unknown>): Promise<void>;
}
