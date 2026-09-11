import type { IUserDataFile, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IUserDataFilesModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Collection, Db, IndexDescription, Document } from 'mongodb';

import { BaseUploadModelRaw } from './BaseUploadModel';

export class UserDataFilesRaw extends BaseUploadModelRaw implements IUserDataFilesModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IUserDataFile>>) {
		super(db, 'user_data_files', trash);
	}

	protected override modelIndexes(): IndexDescription[] {
		return [...super.modelIndexes(), { key: { userId: 1 } }];
	}

	findLastFileByUser<T extends Document = IUserDataFile, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		const query = {
			userId,
		};

		// merging into `O` is a lie only about `sort`; `DocumentWithProjection` reads `O['projection']`
		// alone, and that comes straight from `options`, so the declared return type stays accurate
		return this.findOne<T, O>(query, { ...options, sort: { _updatedAt: -1 } } as unknown as O);
	}
}
