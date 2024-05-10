import type { IInstanceStatus } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IInstanceStatusModel extends IBaseModel<IInstanceStatus> {
	getActiveInstanceCount(): Promise<number>;
}
