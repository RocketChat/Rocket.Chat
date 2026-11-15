import type { IOAuthRefreshToken } from '@rocket.chat/core-typings';
import type { DeleteResult, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IOAuthRefreshTokensModel extends IBaseModel<IOAuthRefreshToken> {
	findOneByRefreshToken<T extends Document = IOAuthRefreshToken, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		refreshToken: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	deleteByUserId(userId: string): Promise<DeleteResult>;
	deleteByUserIds(userIds: string[]): Promise<DeleteResult>;
}
