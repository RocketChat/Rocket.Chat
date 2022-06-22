import type { UpdateWriteOpResult } from 'mongodb';
import type { INps, NPSStatus } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface INpsModel extends IBaseModel<INps> {
	getOpenExpiredAndStartSending(): Promise<INps | undefined>;
	getOpenExpiredAlreadySending(): Promise<INps | null>;
	updateStatusById(_id: INps['_id'], status: INps['status']): Promise<UpdateWriteOpResult>;
	save({
		_id,
		startAt,
		expireAt,
		createdBy,
		status,
	}: Pick<INps, '_id' | 'startAt' | 'expireAt' | 'createdBy' | 'status'>): Promise<UpdateWriteOpResult>;

	closeAllByStatus(status: NPSStatus): Promise<UpdateWriteOpResult>;
}
