import type { IEmojiCustom, EmojiCustomName } from '@rocket.chat/core-typings';
import type { FindCursor, FindOptions, InsertOneResult, UpdateResult, WithId } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IEmojiCustomModel extends IBaseModel<IEmojiCustom> {
	findByNameOrAlias(emojiName: string, options?: FindOptions<IEmojiCustom>): FindCursor<IEmojiCustom>;
	findByNameOrAliasExceptID(name: string, except: string, options?: FindOptions<IEmojiCustom>): FindCursor<IEmojiCustom>;
	setName(_id: string, name: EmojiCustomName): Promise<UpdateResult>;
	setAliases(_id: string, aliases: string[]): Promise<UpdateResult>;
	setExtension(_id: string, extension: string): Promise<UpdateResult>;
	setETagByName(name: EmojiCustomName, etag: string): Promise<UpdateResult>;
	create(data: InsertionModel<IEmojiCustom>): Promise<InsertOneResult<WithId<IEmojiCustom>>>;
	countByNameOrAlias(name: string): Promise<number>;
	findOneByName(name: EmojiCustomName, options?: FindOptions<IEmojiCustom>): Promise<IEmojiCustom | null>;
}
