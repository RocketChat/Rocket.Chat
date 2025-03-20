import type { IOAuthAuthCode } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IOAuthAuthCodesModel extends IBaseModel<IOAuthAuthCode> {
	findOneByAuthCode(authCode: string, options?: FindOptions<IOAuthAuthCode>): Promise<IOAuthAuthCode | null>;
}
