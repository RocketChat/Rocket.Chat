import type { ICustomSound } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, InsertOneResult, UpdateResult, WithId } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ICustomSoundsModel extends IBaseModel<ICustomSound> {
	findByName(name: string, exceptId?: string, options?: FindOptions<ICustomSound>): FindCursor<ICustomSound>;
	create(data: Omit<ICustomSound, '_id'>): Promise<InsertOneResult<WithId<ICustomSound>>>;
	updateById(_id: string, data: Partial<Omit<ICustomSound, '_id'>>): Promise<UpdateResult>;
}
