import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import type { FindOptions, FindCursor, DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ICannedResponseModel extends IBaseModel<IOmnichannelCannedResponse> {
	createOrUpdateCannedResponse(
		_id: string,
		{ shortcut, text, tags, scope, userId, departmentId, createdBy, _createdAt }: IOmnichannelCannedResponse,
	): Promise<Omit<IOmnichannelCannedResponse, '_updatedAt'>>;
	findOneById(id: string, options: FindOptions<IOmnichannelCannedResponse>): Promise<IOmnichannelCannedResponse | null>;
	findOneByShortcut(shortcut: string, options: FindOptions<IOmnichannelCannedResponse>): Promise<IOmnichannelCannedResponse | null>;
	findByCannedResponseId(_id: string, options: FindOptions<IOmnichannelCannedResponse>): FindCursor<IOmnichannelCannedResponse>;
	findByDepartmentId(departmentId: string, options: FindOptions<IOmnichannelCannedResponse>): FindCursor<IOmnichannelCannedResponse>;
	findByShortcut(shortcut: string, options: FindOptions<IOmnichannelCannedResponse>): FindCursor<IOmnichannelCannedResponse>;
	removeById(_id: string): Promise<DeleteResult>;
}
