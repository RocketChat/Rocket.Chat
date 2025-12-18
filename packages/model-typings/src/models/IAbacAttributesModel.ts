import type { IAbacAttribute } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IAbacAttributesModel extends IBaseModel<IAbacAttribute> {
	findOneByKey(key: string, options?: FindOptions<IAbacAttribute>): Promise<IAbacAttribute | null>;
	countTotalValues(): Promise<number>;
}
