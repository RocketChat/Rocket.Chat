import type { ICustomSound } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, InsertOneResult, UpdateResult, WithId } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ICustomSoundsModel extends IBaseModel<ICustomSound> {
	findByName(name: string, options?: FindOptions<ICustomSound>): FindCursor<ICustomSound>;
	findByNameExceptId(name: string, except: string, options?: FindOptions<ICustomSound>): FindCursor<ICustomSound>;
	setName(_id: string, name: string): Promise<UpdateResult>;
	create(data: Omit<ICustomSound, '_id'>): Promise<InsertOneResult<WithId<ICustomSound>>>;
}
