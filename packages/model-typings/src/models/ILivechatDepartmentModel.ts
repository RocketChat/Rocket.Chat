import type { ILivechatDepartment, LivechatDepartmentDTO } from '@rocket.chat/core-typings';
import type { FindOptions, FindCursor, Filter, UpdateResult, Document } from 'mongodb';

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
	countByBusinessHourIdExcludingDepartmentId(businessHourId: string, departmentId: string): Promise<number>;

	findEnabledByBusinessHourId(businessHourId: string, options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;

	findEnabledByListOfBusinessHourIdsAndDepartmentIds(
		businessHourIds: string[],
		departmentIds: string[],
		options: FindOptions<ILivechatDepartment>,
	): FindCursor<ILivechatDepartment>;

	findActiveDepartmentsWithoutBusinessHour(options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;

	addBusinessHourToDepartmentsByIds(ids: string[], businessHourId: string): Promise<Document | UpdateResult>;

	removeBusinessHourFromDepartmentsByIdsAndBusinessHourId(ids: string[], businessHourId: string): Promise<Document | UpdateResult>;

	removeBusinessHourFromDepartmentsByBusinessHourId(businessHourId: string): Promise<Document | UpdateResult>;
	createOrUpdateDepartment(_id: string | null, data: LivechatDepartmentDTO & { type?: string }): Promise<ILivechatDepartment>;

	unsetFallbackDepartmentByDepartmentId(departmentId: string): Promise<Document | UpdateResult>;
	removeDepartmentFromForwardListById(_departmentId: string): Promise<void>;
	updateById(_id: string, update: Partial<ILivechatDepartment>): Promise<Document | UpdateResult>;
	updateNumAgentsById(_id: string, numAgents: number): Promise<Document | UpdateResult>;
	decreaseNumberOfAgentsByIds(_ids: string[]): Promise<Document | UpdateResult>;
	findEnabledWithAgents<T extends Document = ILivechatDepartment>(
		projection?: FindOptions<ILivechatDepartment>['projection'],
	): FindCursor<T>;
	findEnabledWithAgentsAndBusinessUnit<T extends Document = ILivechatDepartment>(
		_: any,
		projection: FindOptions<T>['projection'],
	): Promise<FindCursor<T>>;
	findOneByIdOrName(_idOrName: string, options?: FindOptions<ILivechatDepartment>): Promise<ILivechatDepartment | null>;
	findByUnitIds(unitIds: string[], options?: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;
	countDepartmentsInUnit(unitId: string): Promise<number>;
	findActiveByUnitIds(unitIds: string[], options?: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;
	findNotArchived(options?: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;
	getBusinessHoursWithDepartmentStatuses(): Promise<
		{
			_id: string;
			validDepartments: string[];
			invalidDepartments: string[];
		}[]
	>;
	checkIfMonitorIsMonitoringDepartmentById(monitorId: string, departmentId: string): Promise<boolean>;
	countArchived(): Promise<number>;
	findEnabledInIds(departmentsIds: string[], options?: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;
	archiveDepartment(_id: string): Promise<Document | UpdateResult>;
	unarchiveDepartment(_id: string): Promise<Document | UpdateResult>;
	addDepartmentToUnit(_id: string, unitId: string, ancestors: string[]): Promise<Document | UpdateResult>;
	removeDepartmentFromUnit(_id: string): Promise<Document | UpdateResult>;
}
