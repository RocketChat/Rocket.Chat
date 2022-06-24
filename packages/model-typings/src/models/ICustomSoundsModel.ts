import type { Cursor, FindOneOptions, InsertOneWriteOpResult, UpdateWriteOpResult, WithId, WithoutProjection } from 'mongodb';
import type { ICustomSound } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ICustomSoundsModel extends IBaseModel<ICustomSound> {
	findByName(name: string, options: WithoutProjection<FindOneOptions<ICustomSound>>): Cursor<ICustomSound>;
	findByNameExceptId(name: string, except: string, options: WithoutProjection<FindOneOptions<ICustomSound>>): Cursor<ICustomSound>;
	setName(_id: string, name: string): Promise<UpdateWriteOpResult>;
	create(data: ICustomSound): Promise<InsertOneWriteOpResult<WithId<ICustomSound>>>;
}
