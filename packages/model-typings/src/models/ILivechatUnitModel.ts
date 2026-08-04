import type { ILivechatDepartment, IOmnichannelBusinessUnit } from '@rocket.chat/core-typings';
import type { Filter, FindCursor, DeleteResult, UpdateResult, Document } from 'mongodb';

import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';
import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface ILivechatUnitModel extends IBaseModel<IOmnichannelBusinessUnit> {
	//
	findPaginatedUnits<T extends Document = IOmnichannelBusinessUnit, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(query: Filter<IOmnichannelBusinessUnit>, options?: O): FindPaginated<FindCursor<DocumentWithProjection<T, O>>>;
	findOne<
		P extends Document = IOmnichannelBusinessUnit,
		O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>,
	>(
		originalQuery: Filter<IOmnichannelBusinessUnit>,
		options?: O,
		extra?: Record<string, any>,
	): Promise<DocumentWithProjection<P, O> | null>;
	findOneById<
		P extends Document = IOmnichannelBusinessUnit,
		O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>,
	>(
		_id: IOmnichannelBusinessUnit['_id'],
		options?: O,
		extra?: Record<string, any>,
	): Promise<DocumentWithProjection<P, O> | null>;
	createOrUpdateUnit(
		_id: string | null,
		{ name, visibility }: { name: string; visibility: IOmnichannelBusinessUnit['visibility'] },
		ancestors: string[],
		monitors: { monitorId: string; username: string }[],
		departments: { departmentId: string }[],
	): Promise<Omit<IOmnichannelBusinessUnit, '_updatedAt'>>;
	removeParentAndAncestorById(parentId: string): Promise<UpdateResult | Document>;
	incrementDepartmentsCount(_id: string): Promise<UpdateResult | Document>;
	decrementDepartmentsCount(_id: string): Promise<UpdateResult | Document>;
	removeById(_id: string): Promise<DeleteResult>;
	removeByIdAndUnit(_id: string, unitsFromUser?: string[]): Promise<DeleteResult>;
	findOneByIdOrName<T extends Document = IOmnichannelBusinessUnit, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(_idOrName: string, options: O): Promise<DocumentWithProjection<T, O> | null>;
	findByMonitorId(monitorId: string): Promise<string[]>;
	findMonitoredDepartmentsByMonitorId(monitorId: string, includeDisabled: boolean): Promise<ILivechatDepartment[]>;
	countUnits(): Promise<number>;
}
