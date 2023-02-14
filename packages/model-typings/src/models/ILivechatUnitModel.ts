import type { IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import type { FindOptions, Filter, FindCursor } from 'mongodb';

import type { FindPaginated } from './IBaseModel';
import type { ILivechatDepartmentModel } from './ILivechatDepartmentModel';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILivechatUnitModel extends ILivechatDepartmentModel {
	//
	findPaginatedUnits(
		query: Filter<IOmnichannelBusinessUnit>,
		options?: FindOptions<IOmnichannelBusinessUnit>,
	): FindPaginated<FindCursor<IOmnichannelBusinessUnit>>;
}
