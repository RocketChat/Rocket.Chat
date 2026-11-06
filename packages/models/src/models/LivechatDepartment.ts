import type { ILivechatDepartment, LivechatDepartmentDTO, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatDepartmentModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/tools';
import type { Collection, FindCursor, Db, Filter, FindOptions, UpdateResult, Document, IndexDescription, AggregationCursor } from 'mongodb';

import { LivechatDepartmentAgents, LivechatUnitMonitors } from '../index';
import { BaseRaw } from './BaseRaw';

export class LivechatDepartmentRaw extends BaseRaw<ILivechatDepartment> implements ILivechatDepartmentModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatDepartment>>) {
		super(db, 'livechat_department', trash);
	}

	removeParentAndAncestorById(_id: string): Promise<Document | UpdateResult> {
		throw new Error('Method not implemented.');
	}

	protected override modelIndexes(): Array<IndexDescription> {
		return [
			{
				key: {
					name: 1,
				},
			},
			{
				key: {
					businessHourId: 1,
				},
				sparse: true,
			},
			{
				key: {
					type: 1,
				},
				sparse: true,
			},
			{
				key: {
					numAgents: 1,
					enabled: 1,
				},
			},
			{
				key: {
					parentId: 1,
				},
				sparse: true,
			},
			{
				key: {
					ancestors: 1,
				},
				sparse: true,
			},
			{
				key: {
					archived: 1,
				},
				sparse: true,
			},
		];
	}

	countTotal(): Promise<number> {
		return this.estimatedDocumentCount();
	}

	findInIds<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		departmentsIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = { _id: { $in: departmentsIds } };
		return this.find<T, O>(query, options);
	}

	findByNameRegexWithExceptionsAndConditions<
		T extends Document = ILivechatDepartment,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		searchTerm: string,
		exceptions: string[] = [],
		conditions: Filter<ILivechatDepartment> = {},
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const nameRegex = new RegExp(`^${escapeRegExp(searchTerm).trim()}`, 'i');

		const query = {
			name: nameRegex,
			_id: {
				$nin: exceptions,
			},
			...conditions,
		};

		return this.find<T, O>(query, options);
	}

	findByBusinessHourId<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		businessHourId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = { businessHourId };
		return this.find<T, O>(query, options);
	}

	countByBusinessHourIdExcludingDepartmentId(businessHourId: string, departmentId: string): Promise<number> {
		const query = { businessHourId, _id: { $ne: departmentId } };
		return this.countDocuments(query);
	}

	findEnabledByBusinessHourId<
		T extends Document = ILivechatDepartment,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(businessHourId: string, options?: O): FindCursor<DocumentWithProjection<T, O>> {
		const query = { businessHourId, enabled: true };
		return this.find<T, O>(query, options);
	}

	findActiveDepartmentsWithoutBusinessHour<
		T extends Document = ILivechatDepartment,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(options?: O): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			enabled: true,
			businessHourId: { $exists: false },
		};
		return this.find<T, O>(query, options);
	}

	findEnabledInIds<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		departmentsIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = { _id: { $in: departmentsIds }, enabled: true };
		return this.find<T, O>(query, options);
	}

	addBusinessHourToDepartmentsByIds(ids: string[] = [], businessHourId: string): Promise<Document | UpdateResult> {
		const query = {
			_id: { $in: ids },
		};

		const update = {
			$set: {
				businessHourId,
			},
		};

		return this.updateMany(query, update);
	}

	removeBusinessHourFromDepartmentsByIdsAndBusinessHourId(ids: string[] = [], businessHourId: string): Promise<Document | UpdateResult> {
		const query = {
			_id: { $in: ids },
			businessHourId,
		};

		const update = {
			$unset: {
				businessHourId: 1,
			},
		};

		return this.updateMany(query, update);
	}

	removeBusinessHourFromDepartmentsByBusinessHourId(businessHourId: string): Promise<Document | UpdateResult> {
		const query = {
			businessHourId,
		};

		const update = {
			$unset: {
				businessHourId: 1,
			},
		};

		return this.updateMany(query, update);
	}

	unarchiveDepartment(_id: string): Promise<UpdateResult> {
		return this.updateOne({ _id }, { $set: { archived: false } });
	}

	archiveDepartment(_id: string): Promise<UpdateResult> {
		return this.updateOne({ _id }, { $set: { archived: true, enabled: false } });
	}

	addDepartmentToUnit(_id: string, unitId: string, ancestors: string[]): Promise<Document | UpdateResult> {
		return this.updateOne({ _id }, { $set: { parentId: unitId, ancestors } });
	}

	removeDepartmentFromUnit(_id: string): Promise<Document | UpdateResult> {
		return this.updateOne({ _id }, { $unset: { parentId: 1, ancestors: 1 } });
	}

	async createOrUpdateDepartment(_id: string | null, data: LivechatDepartmentDTO & { type?: string }): Promise<ILivechatDepartment> {
		const current = _id ? await this.findOneById(_id) : null;

		const record = {
			...data,
		} as ILivechatDepartment;

		if (_id) {
			await this.updateOne({ _id }, { $set: record });
		} else {
			_id = (await this.insertOne(record)).insertedId;
		}

		if (current?.enabled !== data.enabled) {
			await LivechatDepartmentAgents.setDepartmentEnabledByDepartmentId(_id, data.enabled);
		}

		const latestDept = await this.findOneById(_id);
		if (!latestDept) {
			throw new Error(`Department ${_id} not found`);
		}

		return latestDept;
	}

	unsetFallbackDepartmentByDepartmentId(departmentId: string): Promise<Document | UpdateResult> {
		return this.updateMany({ fallbackDepartment: departmentId }, { $unset: { fallbackDepartment: 1 } });
	}

	removeDepartmentFromForwardListById(_departmentId: string): Promise<void> {
		throw new Error('Method not implemented in Community Edition.');
	}

	updateById(_id: string, update: Partial<ILivechatDepartment>): Promise<Document | UpdateResult> {
		return this.updateOne({ _id }, update);
	}

	updateNumAgentsById(_id: string, numAgents: number): Promise<Document | UpdateResult> {
		return this.updateOne({ _id }, { $set: { numAgents } });
	}

	decreaseNumberOfAgentsByIds(_ids: string[]): Promise<Document | UpdateResult> {
		return this.updateMany({ _id: { $in: _ids } }, { $inc: { numAgents: -1 } });
	}

	findEnabledWithAgents<T extends Document = ILivechatDepartment>(projection: FindOptions<T>['projection'] = {}): FindCursor<T> {
		const query = {
			numAgents: { $gt: 0 },
			enabled: true,
		};
		return this.find<T>(query, projection && { projection });
	}

	findEnabledWithAgentsAndRegistration<T extends Document = ILivechatDepartment>(
		projection: FindOptions<T>['projection'] = {},
	): FindCursor<T> {
		const query = {
			numAgents: { $gt: 0 },
			enabled: true,
			showOnRegistration: true,
		};
		return this.find<T>(query, projection && { projection });
	}

	findOneEnabledWithAgentsAndRegistration<T extends Document = ILivechatDepartment>(
		projection: FindOptions<T>['projection'] = {},
	): Promise<T | null> {
		const query = {
			numAgents: { $gt: 0 },
			enabled: true,
			showOnRegistration: true,
		};
		return this.findOne<T>(query, projection && { projection });
	}

	findEnabledWithAgentsAndBusinessUnit<T extends Document = ILivechatDepartment>(
		_: any,
		projection?: FindOptions<T>['projection'],
	): FindCursor<T> {
		return this.findEnabledWithAgents(projection);
	}

	findOneByIdOrName<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_idOrName: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null> {
		const query = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne<T, O>(query, options);
	}

	findByUnitIds<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		unitIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			parentId: {
				$exists: true,
				$in: unitIds,
			},
		};

		return this.find<T, O>(query, options);
	}

	countDepartmentsInUnit(unitId: string): Promise<number> {
		return this.countDocuments({ parentId: unitId });
	}

	findActiveByUnitIds<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_unitIds: string[],
		_options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		throw new Error('not-implemented');
	}

	findNotArchived<T extends Document = ILivechatDepartment, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = { archived: { $ne: false } };

		return this.find<T, O>(query, options);
	}

	getBusinessHoursWithDepartmentStatuses(): Promise<
		{
			_id: string;
			validDepartments: string[];
			invalidDepartments: string[];
		}[]
	> {
		return this.col
			.aggregate<{ _id: string; validDepartments: string[]; invalidDepartments: string[] }>([
				{
					$match: {
						businessHourId: {
							$exists: true,
						},
					},
				},
				{
					$group: {
						_id: '$businessHourId',
						validDepartments: {
							$push: {
								$cond: {
									if: {
										$or: [
											{
												$eq: ['$enabled', true],
											},
											{
												$ne: ['$archived', true],
											},
										],
									},
									then: '$_id',
									else: '$$REMOVE',
								},
							},
						},
						invalidDepartments: {
							$push: {
								$cond: {
									if: {
										$or: [{ $eq: ['$enabled', false] }, { $eq: ['$archived', true] }],
									},
									then: '$_id',
									else: '$$REMOVE',
								},
							},
						},
					},
				},
			])
			.toArray();
	}

	checkIfMonitorIsMonitoringDepartmentById(monitorId: string, departmentId: string): Promise<boolean> {
		const aggregation = [
			{
				$match: {
					enabled: true,
					_id: departmentId,
				},
			},
			{
				$lookup: {
					from: LivechatUnitMonitors.getCollectionName(),
					localField: 'parentId',
					foreignField: 'unitId',
					as: 'monitors',
					pipeline: [
						{
							$match: {
								monitorId,
							},
						},
					],
				},
			},
			{
				$match: {
					monitors: {
						$exists: true,
						$ne: [],
					},
				},
			},
			{
				$project: {
					_id: 1,
				},
			},
		];

		return this.col.aggregate(aggregation).hasNext();
	}

	countArchived(): Promise<number> {
		return this.countDocuments({ archived: true });
	}

	findByParentId(_parentId: string, _options?: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment> {
		throw new Error('Method not implemented in CE');
	}

	findAgentsByBusinessHourId(_businessHourId: string): AggregationCursor<{ agentIds: string[] }> {
		throw new Error('Method not implemented in CE');
	}
}
