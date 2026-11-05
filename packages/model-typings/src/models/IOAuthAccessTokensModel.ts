import type { IOAuthAccessToken } from '@rocket.chat/core-typings';
import type { DeleteResult, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel.js';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection.js';

export interface IOAuthAccessTokensModel extends IBaseModel<IOAuthAccessToken> {
	findOneByAccessToken<T extends Document = IOAuthAccessToken, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		accessToken: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findOneByRefreshToken<T extends Document = IOAuthAccessToken, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		refreshToken: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	deleteByUserId(userId: string): Promise<DeleteResult>;
	deleteByUserIds(userIds: string[]): Promise<DeleteResult>;
}
