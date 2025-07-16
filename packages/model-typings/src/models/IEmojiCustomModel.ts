import type { IEmojiCustom } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, InsertOneResult, UpdateResult, WithId } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IEmojiCustomModel extends IBaseModel<IEmojiCustom> {
	findByNameOrAlias(emojiName: string, options?: FindOptions<IEmojiCustom>): FindCursor<IEmojiCustom>;
	findByNameOrAliasExceptID(name: string, except: string, options?: FindOptions<IEmojiCustom>): FindCursor<IEmojiCustom>;
	setName(_id: string, name: string): Promise<UpdateResult>;
	setAliases(_id: string, aliases: string[]): Promise<UpdateResult>;
	setExtension(_id: string, extension: string): Promise<UpdateResult>;
	setETagByName(name: string, etag: string): Promise<UpdateResult>;
	create(data: InsertionModel<IEmojiCustom>): Promise<InsertOneResult<WithId<IEmojiCustom>>>;
	countByNameOrAlias(name: string): Promise<number>;
}
