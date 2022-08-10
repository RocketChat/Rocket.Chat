import type { FindOptions, FindCursor, Filter, UpdateResult, Document } from 'mongodb';
import type { ILivechatDepartmentRecord } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatDepartmentModel extends IBaseModel<ILivechatDepartmentRecord> {
	findInIds(departmentsIds: string[], options: FindOptions<ILivechatDepartmentRecord>): FindCursor<ILivechatDepartmentRecord>;
	findByNameRegexWithExceptionsAndConditions(
		searchTerm: string,
		exceptions: string[],
		conditions: Filter<ILivechatDepartmentRecord>,
		options: FindOptions<ILivechatDepartmentRecord>,
	): FindCursor<ILivechatDepartmentRecord>;

	findByBusinessHourId(businessHourId: string, options: FindOptions<ILivechatDepartmentRecord>): FindCursor<ILivechatDepartmentRecord>;

	findEnabledByBusinessHourId(
		businessHourId: string,
		options: FindOptions<ILivechatDepartmentRecord>,
	): FindCursor<ILivechatDepartmentRecord>;

	findEnabledByListOfBusinessHourIdsAndDepartmentIds(
		businessHourIds: string[],
		departmentIds: string[],
		options: FindOptions<ILivechatDepartmentRecord>,
	): FindCursor<ILivechatDepartmentRecord>;

	addBusinessHourToDepartmentsByIds(ids: string[], businessHourId: string): Promise<Document | UpdateResult>;

	removeBusinessHourFromDepartmentsByIdsAndBusinessHourId(ids: string[], businessHourId: string): Promise<Document | UpdateResult>;

	removeBusinessHourFromDepartmentsByBusinessHourId(businessHourId: string): Promise<Document | UpdateResult>;
	createOrUpdateDepartment(_id: string, data: ILivechatDepartmentRecord): Promise<Omit<ILivechatDepartmentRecord, '_updatedAt'>>;
	findActiveByUnitIds(unitIds: string[], options: FindOptions<ILivechatDepartmentRecord>): FindCursor<ILivechatDepartmentRecord>;
	findEnabledWithAgents(projection?: FindOptions<ILivechatDepartmentRecord>): FindCursor<ILivechatDepartmentRecord>;
	findByUnitIds(unitIds: string[], options: FindOptions<ILivechatDepartmentRecord>): FindCursor<ILivechatDepartmentRecord>;
}
