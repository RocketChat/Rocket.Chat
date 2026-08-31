import type { IUserDataFile } from '@rocket.chat/core-typings';
import type { Document } from 'mongodb';

import type { IBaseUploadsModel } from './IBaseUploadsModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IUserDataFilesModel extends IBaseUploadsModel<IUserDataFile> {
	findLastFileByUser<T extends Document = IUserDataFile, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		userId: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
}
