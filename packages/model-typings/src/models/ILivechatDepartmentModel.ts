import type { FindOneOptions, Cursor, FilterQuery, WriteOpResult } from 'mongodb';
import type { ILivechatDepartmentRecord } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatDepartmentModel extends IBaseModel<ILivechatDepartmentRecord> {
	findInIds(departmentsIds: string[], options: FindOneOptions<ILivechatDepartmentRecord>): Cursor<ILivechatDepartmentRecord>;
	findByNameRegexWithExceptionsAndConditions(
		searchTerm: string,
		exceptions: string[],
		conditions: FilterQuery<ILivechatDepartmentRecord>,
		options: FindOneOptions<ILivechatDepartmentRecord>,
	): Cursor<ILivechatDepartmentRecord>;

	findByBusinessHourId(businessHourId: string, options: FindOneOptions<ILivechatDepartmentRecord>): Cursor<ILivechatDepartmentRecord>;

	findEnabledByBusinessHourId(
		businessHourId: string,
		options: FindOneOptions<ILivechatDepartmentRecord>,
	): Cursor<ILivechatDepartmentRecord>;

	findEnabledByListOfBusinessHourIdsAndDepartmentIds(
		businessHourIds: string[],
		departmentIds: string[],
		options: FindOneOptions<ILivechatDepartmentRecord>,
	): Cursor<ILivechatDepartmentRecord>;

	addBusinessHourToDepartmentsByIds(ids: string[], businessHourId: string): Promise<WriteOpResult>;

	removeBusinessHourFromDepartmentsByIdsAndBusinessHourId(ids: string[], businessHourId: string): Promise<WriteOpResult>;

	removeBusinessHourFromDepartmentsByBusinessHourId(businessHourId: string): Promise<WriteOpResult>;
}
