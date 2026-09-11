import type { IOAuthAuthCode } from '@rocket.chat/core-typings';
import type { DeleteResult, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface IOAuthAuthCodesModel extends IBaseModel<IOAuthAuthCode> {
	findOneByAuthCode<T extends Document = IOAuthAuthCode, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		authCode: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	deleteByUserId(userId: string): Promise<DeleteResult>;
	deleteByUserIds(userIds: string[]): Promise<DeleteResult>;
}
