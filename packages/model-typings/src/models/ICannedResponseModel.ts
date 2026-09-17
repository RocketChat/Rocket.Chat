import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import type { FindCursor, DeleteResult, UpdateResult, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ICannedResponseModel extends IBaseModel<IOmnichannelCannedResponse> {
	findOneByShortcut<T extends Document = IOmnichannelCannedResponse, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		shortcut: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findByDepartmentId<
		T extends Document = IOmnichannelCannedResponse,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		departmentId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	removeById(_id: string): Promise<DeleteResult>;
	createCannedResponse({
		shortcut,
		text,
		tags,
		scope,
		userId,
		departmentId,
		createdBy,
		_createdAt,
	}: Omit<IOmnichannelCannedResponse, '_id' | '_updatedAt'>): Promise<Omit<IOmnichannelCannedResponse, '_updatedAt'>>;
	updateCannedResponse(
		_id: string,
		{ shortcut, text, tags, scope, userId, departmentId, createdBy }: Omit<IOmnichannelCannedResponse, '_id' | '_updatedAt' | '_createdAt'>,
	): Promise<Omit<IOmnichannelCannedResponse, '_updatedAt' | '_createdAt'>>;
	removeTagFromCannedResponses(tagId: string): Promise<UpdateResult | Document>;
}
