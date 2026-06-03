import type { ILoginCode } from '@rocket.chat/core-typings';
import type { DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILoginCodesModel extends IBaseModel<ILoginCode> {
	createCode(userId: string): Promise<string>;
	findOneNotExpiredByCode(code: string): Promise<ILoginCode | null>;
	removeByCode(code: string): Promise<DeleteResult>;
}
