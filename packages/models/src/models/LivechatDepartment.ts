import type { ILivechatDepartment, LivechatDepartmentDTO, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatDepartmentModel } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type {
	Collection,
	FindCursor,
	Db,
	Filter,
	FindOptions,
	UpdateResult,
	Document,
	IndexDescription,
	DeleteResult,
	UpdateFilter,
	AggregationCursor,
} from 'mongodb';

import { LivechatDepartmentAgents, LivechatUnitMonitors } from '../index';
import { BaseRaw } from './BaseRaw';

export class LivechatDepartmentRaw extends BaseRaw<ILivechatDepartment> implements ILivechatDepartmentModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatDepartment>>) {
		super(db, 'livechat_department', trash);
	}

	unfilteredFind(_query: Filter<ILivechatDepartment>, _options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment> {
		throw new Error('Method not implemented.');
	}

	unfilteredFindOne(_query: Filter<ILivechatDepartment>, _options: FindOptions<ILivechatDepartment>): Promise<ILivechatDepartment | null> {
		throw new Error('Method not implemented.');
	}

	unfilteredUpdate(
		_query: Filter<ILivechatDepartment>,
		_update: UpdateFilter<ILivechatDepartment>,
		_options: FindOptions<ILivechatDepartment>,
	): Promise<UpdateResult> {
		throw new Error('Method not implemented.');
	}

	unfilteredRemove(_query: Filter<ILivechatDepartment>): Promise<DeleteResult> {
		throw new Error('Method not implemented.');
	}

	removeParentAndAncestorById(_id: string): Promise<Document | UpdateResult> {
		throw new Error('Method not implemented.');
	}

	protected modelIndexes(): Array<IndexDescription> {
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

	findInIds(departmentsIds: string[], options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment> {
		const query = { _id: { $in: departmentsIds } };
		return this.find(query, options);
	}

	findByNameRegexWithExceptionsAndConditions(
		searchTerm: string,
		exceptions: string[] = [],
		conditions: Filter<ILivechatDepartment> = {},
		options: FindOptions<ILivechatDepartment> = {},
	): FindCursor<ILivechatDepartment> {
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

		return this.find(query, options);
	}

	findByBusinessHourId(businessHourId: string, options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment> {
		const query = { businessHourId };
		return this.find(query, options);
	}

	countByBusinessHourIdExcludingDepartmentId(businessHourId: string, departmentId: string): Promise<number> {
		const query = { businessHourId, _id: { $ne: departmentId } };
		return this.countDocuments(query);
	}

	findEnabledByBusinessHourId(businessHourId: string, options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment> {
		const query = { businessHourId, enabled: true };
		return this.find(query, options);
	}

	findActiveDepartmentsWithoutBusinessHour(options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment> {
		const query = {
			enabled: true,
			businessHourId: { $exists: false },
		};
		return this.find(query, options);
	}

	findEnabledByListOfBusinessHourIdsAndDepartmentIds(
		businessHourIds: string[],
		departmentIds: string[],
		options: FindOptions<ILivechatDepartment>,
	): FindCursor<ILivechatDepartment> {
		const query: Filter<ILivechatDepartment> = {
			enabled: true,
			businessHourId: {
				$in: businessHourIds,
			},
			_id: {
				$in: departmentIds,
			},
		};
		return this.find(query, options);
	}

	findEnabledInIds(departmentsIds: string[], options?: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment> {
		const query = { _id: { $in: departmentsIds }, enabled: true };
		return this.find(query, options);
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

	unarchiveDepartment(_id: string): Promise<Document | UpdateResult> {
		return this.updateOne({ _id }, { $set: { archived: false } });
	}

	archiveDepartment(_id: string): Promise<Document | UpdateResult> {
		return this.updateOne({ _id }, { $set: { archived: true, enabled: false } });
	}

	addDepartmentToUnit(_id: string, unitId: string, ancestors: string[]): Promise<Document | UpdateResult> {
		return this.updateOne({ _id }, { $set: { parentId: unitId, ancestors } });
	}

	removeDepartmentFromUnit(_id: string): Promise<Document | UpdateResult> {
		return this.updateOne({ _id }, { $set: { parentId: null, ancestors: null } });
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

	async findEnabledWithAgentsAndBusinessUnit<T extends Document = ILivechatDepartment>(
		_: any,
		projection: FindOptions<T>['projection'] = {},
	): Promise<FindCursor<T>> {
		const query = {
			numAgents: { $gt: 0 },
			enabled: true,
		};
		return this.find<T>(query, projection && { projection });
	}

	findOneByIdOrName(_idOrName: string, options: FindOptions<ILivechatDepartment> = {}): Promise<ILivechatDepartment | null> {
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

		return this.findOne(query, options);
	}

	findByUnitIds(unitIds: string[], options: FindOptions<ILivechatDepartment> = {}): FindCursor<ILivechatDepartment> {
		const query = {
			parentId: {
				$exists: true,
				$in: unitIds,
			},
		};

		return this.find(query, options);
	}

	countDepartmentsInUnit(unitId: string): Promise<number> {
		return this.countDocuments({ parentId: unitId });
	}

	findActiveByUnitIds<T extends Document = ILivechatDepartment>(unitIds: string[], options: FindOptions<T> = {}): FindCursor<T> {
		const query = {
			enabled: true,
			numAgents: { $gt: 0 },
			parentId: {
				$exists: true,
				$in: unitIds,
			},
		};

		return this.find<T>(query, options);
	}

	findNotArchived(options: FindOptions<ILivechatDepartment> = {}): FindCursor<ILivechatDepartment> {
		const query = { archived: { $ne: false } };

		return this.find(query, options);
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

	findByParentId(_parentId: string, _options?: FindOptions<ILivechatDepartment> | undefined): FindCursor<ILivechatDepartment> {
		throw new Error('Method not implemented in CE');
	}

	findAgentsByBusinessHourId(_businessHourId: string): AggregationCursor<{ agentIds: string[] }> {
		throw new Error('Method not implemented in CE');
	}
}
