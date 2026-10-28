import type { ILivechatDepartment, LivechatDepartmentDTO } from '@rocket.chat/core-typings';
import type { FindOptions, FindCursor, Filter, UpdateResult, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ILivechatDepartmentModel extends IBaseModel<ILivechatDepartment> {
	countTotal(): Promise<number>;
	findInIds<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		departmentsIds: string[],
		options: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByNameRegexWithExceptionsAndConditions<
		T extends Document = ILivechatDepartment,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		searchTerm: string,
		exceptions: string[],
		conditions: Filter<ILivechatDepartment>,
		options: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findByBusinessHourId<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		businessHourId: string,
		options: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	countByBusinessHourIdExcludingDepartmentId(businessHourId: string, departmentId: string): Promise<number>;

	findEnabledByBusinessHourId<
		T extends Document = ILivechatDepartment,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		businessHourId: string,
		options: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findActiveDepartmentsWithoutBusinessHour<
		T extends Document = ILivechatDepartment,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		options: O,
	): FindCursor<DocumentWithProjection<T, O>>;

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
	): FindCursor<T>;
	findOneByIdOrName<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_idOrName: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	findByUnitIds<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		unitIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	countDepartmentsInUnit(unitId: string): Promise<number>;
	findActiveByUnitIds<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		unitIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findNotArchived<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	getBusinessHoursWithDepartmentStatuses(): Promise<
		{
			_id: string;
			validDepartments: string[];
			invalidDepartments: string[];
		}[]
	>;
	checkIfMonitorIsMonitoringDepartmentById(monitorId: string, departmentId: string): Promise<boolean>;
	countArchived(): Promise<number>;
	findEnabledInIds<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		departmentsIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	archiveDepartment(_id: string): Promise<UpdateResult>;
	unarchiveDepartment(_id: string): Promise<UpdateResult>;
	addDepartmentToUnit(_id: string, unitId: string, ancestors: string[]): Promise<Document | UpdateResult>;
	removeDepartmentFromUnit(_id: string): Promise<Document | UpdateResult>;
	findEnabledWithAgentsAndRegistration<T extends Document = ILivechatDepartment>(projection?: FindOptions<T>['projection']): FindCursor<T>;
	findOneEnabledWithAgentsAndRegistration<T extends Document = ILivechatDepartment>(
		projection?: FindOptions<T>['projection'],
	): Promise<T | null>;
}
