import type { ILivechatDepartmentModel } from './ILivechatDepartmentModel';
import type { IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import type { FindOptions, Filter, FindCursor } from 'mongodb';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILivechatUnitModel extends ILivechatDepartmentModel {
	//
	findPaginatedUnits(query: Filter<IOmnichannelBusinessUnit>, options?: FindOptions<IOmnichannelBusinessUnit>): FindCursor<IOmnichannelBusinessUnit>;
}
