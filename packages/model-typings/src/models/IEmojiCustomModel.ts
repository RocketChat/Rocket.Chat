import type { Cursor, FindOneOptions, InsertOneWriteOpResult, UpdateWriteOpResult, WithId, WithoutProjection } from 'mongodb';
import type { IEmojiCustom } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IEmojiCustomModel extends IBaseModel<IEmojiCustom> {
	findByNameOrAlias(emojiName: string, options: WithoutProjection<FindOneOptions<IEmojiCustom>>): Cursor<IEmojiCustom>;
	findByNameOrAliasExceptID(name: string, except: string, options: WithoutProjection<FindOneOptions<IEmojiCustom>>): Cursor<IEmojiCustom>;
	setName(_id: string, name: string): Promise<UpdateWriteOpResult>;
	setAliases(_id: string, aliases: string[]): Promise<UpdateWriteOpResult>;
	setExtension(_id: string, extension: string): Promise<UpdateWriteOpResult>;
	create(data: IEmojiCustom): Promise<InsertOneWriteOpResult<WithId<IEmojiCustom>>>;
}
