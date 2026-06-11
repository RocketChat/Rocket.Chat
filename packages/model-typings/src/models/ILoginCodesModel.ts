import type { ILoginCode } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILoginCodesModel extends IBaseModel<ILoginCode> {
	createCode(userId: string): Promise<string>;
	findOneNotExpiredByCodeAndDelete(code: string): Promise<ILoginCode | null>;
}
