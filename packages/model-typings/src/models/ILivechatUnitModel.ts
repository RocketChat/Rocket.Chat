import type { ILivechatDepartment, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import type { FindOptions, Filter, FindCursor, DeleteResult, UpdateResult, Document } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

// @ts-expect-error - Overriding base types :)
export interface ILivechatUnitModel extends IBaseModel<IOmnichannelBusinessUnit> {
	//
	findPaginatedUnits(
		query: Filter<IOmnichannelBusinessUnit>,
		options?: FindOptions<IOmnichannelBusinessUnit>,
	): FindPaginated<FindCursor<IOmnichannelBusinessUnit>>;
	find(
		originalQuery: Filter<IOmnichannelBusinessUnit>,
		options: FindOptions<IOmnichannelBusinessUnit>,
	): FindCursor<IOmnichannelBusinessUnit>;
	findOne(
		originalQuery: Filter<IOmnichannelBusinessUnit>,
		options: FindOptions<IOmnichannelBusinessUnit>,
	): Promise<IOmnichannelBusinessUnit | null>;
	update(
		originalQuery: Filter<IOmnichannelBusinessUnit>,
		update: Filter<IOmnichannelBusinessUnit>,
		options: FindOptions<IOmnichannelBusinessUnit>,
	): Promise<UpdateResult>;
	remove(query: Filter<IOmnichannelBusinessUnit>): Promise<DeleteResult>;
	createOrUpdateUnit(
		_id: string | null,
		{ name, visibility }: { name: string; visibility: IOmnichannelBusinessUnit['visibility'] },
		ancestors: string[],
		monitors: { monitorId: string; username: string }[],
		departments: { departmentId: string }[],
	): Promise<Omit<IOmnichannelBusinessUnit, '_updatedAt'>>;
	removeParentAndAncestorById(parentId: string): Promise<UpdateResult | Document>;
	removeById(_id: string): Promise<DeleteResult>;
	findOneByIdOrName(_idOrName: string, options: FindOptions<IOmnichannelBusinessUnit>): Promise<IOmnichannelBusinessUnit | null>;
	findByMonitorId(monitorId: string): Promise<string[]>;
	findMonitoredDepartmentsByMonitorId(monitorId: string, includeDisabled: boolean): Promise<ILivechatDepartment[]>;
	countUnits(): Promise<number>;
}
