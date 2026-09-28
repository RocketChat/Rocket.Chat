import type { IEmojiCustom } from '@rocket.chat/core-typings';
import type { FindCursor, InsertOneResult, UpdateResult, WithId, Document } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IEmojiCustomModel extends IBaseModel<IEmojiCustom> {
	findByNameOrAlias<T extends Document = IEmojiCustom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		emojiName: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findOneByNamesOrAliases<T extends Document = IEmojiCustom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		names: string[],
		exceptId?: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findByNameOrAliasExceptID<T extends Document = IEmojiCustom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		except: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	setName(_id: string, name: string): Promise<UpdateResult>;
	setAliases(_id: string, aliases: string[]): Promise<UpdateResult>;
	setExtension(_id: string, extension: string): Promise<UpdateResult>;
	setETagByName(name: string, etag: string): Promise<UpdateResult>;
	create(data: InsertionModel<IEmojiCustom>): Promise<InsertOneResult<WithId<IEmojiCustom>>>;
	countByNameOrAlias(name: string): Promise<number>;
	findOneByName<T extends Document = IEmojiCustom, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		name: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
}
