import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import type { FindOptions, FindCursor, DeleteResult, UpdateResult, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ICannedResponseModel extends IBaseModel<IOmnichannelCannedResponse> {
	findOneById(_id: string, options?: FindOptions<IOmnichannelCannedResponse>): Promise<IOmnichannelCannedResponse | null>;
	findOneByShortcut(shortcut: string, options?: FindOptions<IOmnichannelCannedResponse>): Promise<IOmnichannelCannedResponse | null>;
	findByCannedResponseId(_id: string, options?: FindOptions<IOmnichannelCannedResponse>): FindCursor<IOmnichannelCannedResponse>;
	findByDepartmentId(departmentId: string, options?: FindOptions<IOmnichannelCannedResponse>): FindCursor<IOmnichannelCannedResponse>;
	findByShortcut(shortcut: string, options?: FindOptions<IOmnichannelCannedResponse>): FindCursor<IOmnichannelCannedResponse>;
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
