import type { IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import type { Filter, FindCursor, UpdateResult, DeleteResult, Document, FindOptions } from 'mongodb';

import type { ILivechatDepartmentModel } from './ILivechatDepartmentModel';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILivechatUnitModel extends ILivechatDepartmentModel {
	unfilteredFind(
		query: Filter<IOmnichannelBusinessUnit>,
		options: FindOptions<IOmnichannelBusinessUnit>,
	): FindCursor<IOmnichannelBusinessUnit>;
	findByMonitorId(monitorId: string): Promise<string[]>;
	update(query: Filter<IOmnichannelBusinessUnit>, update: Partial<IOmnichannelBusinessUnit>): Promise<Document | UpdateResult>;
	remove(query: Filter<IOmnichannelBusinessUnit>): Promise<Document | DeleteResult>;
	removeParentAndAncestorById(parentId: string): Promise<UpdateResult | Document>;
	removeById(_id: string): Promise<DeleteResult>;
	findMonitoredDepartmentsByMonitorId(monitorId: string): Promise<FindCursor<IOmnichannelBusinessUnit>>;
	createOrUpdateUnit(
		_id: string,
		{ name, visibility }: { name: string; visibility: string },
		ancestors: string[],
		monitors: { monitorId: string; username: string }[],
		departments: string[],
	): Promise<IOmnichannelBusinessUnit>;
}
