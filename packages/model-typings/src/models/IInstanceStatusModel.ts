import type { IInstanceRecord } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IInstanceStatusModel extends IBaseModel<IInstanceRecord> {
	getActiveInstanceCount(): Promise<number>;
}
