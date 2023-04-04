import type { FindOptions, FindCursor, Filter, UpdateResult, Document } from 'mongodb';
import type { ILivechatDepartment } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatDepartmentModel extends IBaseModel<ILivechatDepartment> {
	countTotal(): Promise<number>;
	findInIds(departmentsIds: string[], options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;
	findByNameRegexWithExceptionsAndConditions(
		searchTerm: string,
		exceptions: string[],
		conditions: Filter<ILivechatDepartment>,
		options: FindOptions<ILivechatDepartment>,
	): FindCursor<ILivechatDepartment>;

	findByBusinessHourId(businessHourId: string, options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;

	findEnabledByBusinessHourId(businessHourId: string, options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;

	findEnabledByListOfBusinessHourIdsAndDepartmentIds(
		businessHourIds: string[],
		departmentIds: string[],
		options: FindOptions<ILivechatDepartment>,
	): FindCursor<ILivechatDepartment>;

	addBusinessHourToDepartmentsByIds(ids: string[], businessHourId: string): Promise<Document | UpdateResult>;

	removeBusinessHourFromDepartmentsByIdsAndBusinessHourId(ids: string[], businessHourId: string): Promise<Document | UpdateResult>;

	removeBusinessHourFromDepartmentsByBusinessHourId(businessHourId: string): Promise<Document | UpdateResult>;
	createOrUpdateDepartment(_id: string, data: ILivechatDepartment): Promise<ILivechatDepartment>;

	unsetFallbackDepartmentByDepartmentId(departmentId: string): Promise<Document | UpdateResult>;
	removeDepartmentFromForwardListById(_departmentId: string): Promise<void>;
	saveDepartmentsByAgent(agent: { _id: string; username: string }, departments: string[]): Promise<void>;
	updateById(_id: string, update: Partial<ILivechatDepartment>): Promise<Document | UpdateResult>;
	updateNumAgentsById(_id: string, numAgents: number): Promise<Document | UpdateResult>;
	findEnabledWithAgents(projection: FindOptions<ILivechatDepartment>['projection']): FindCursor<ILivechatDepartment>;
	findEnabledWithAgentsAndBusinessUnit(_: any, projection: FindOptions<ILivechatDepartment>['projection']): FindCursor<ILivechatDepartment>;
	findOneByIdOrName(_idOrName: string, options: FindOptions<ILivechatDepartment>): Promise<ILivechatDepartment | null>;
	findByUnitIds(unitIds: string[], options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;
	findActiveByUnitIds(unitIds: string[], options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;
}
