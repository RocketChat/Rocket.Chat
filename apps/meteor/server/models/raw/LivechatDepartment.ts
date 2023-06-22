import type { ILivechatDepartment, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatDepartmentModel } from '@rocket.chat/model-typings';
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
} from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { LivechatDepartmentAgents } from '@rocket.chat/models';

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
		];
	}

	countTotal(): Promise<number> {
		return this.col.countDocuments();
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

	async createOrUpdateDepartment(
		_id: string | null,
		data: {
			enabled: boolean;
			name: string;
			description?: string;
			showOnRegistration: boolean;
			email: string;
			showOnOfflineForm: boolean;
			requestTagBeforeClosingChat?: boolean;
			chatClosingTags?: string[];
			fallbackForwardDepartment?: string;
			departmentsAllowedToForward?: string[];
			type?: string;
		},
	): Promise<ILivechatDepartment> {
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

		return Object.assign(record, { _id });
	}

	unsetFallbackDepartmentByDepartmentId(departmentId: string): Promise<Document | UpdateResult> {
		return this.updateMany({ fallbackDepartment: departmentId }, { $unset: { fallbackDepartment: 1 } });
	}

	removeDepartmentFromForwardListById(_departmentId: string): Promise<void> {
		throw new Error('Method not implemented in Community Edition.');
	}

	async saveDepartmentsByAgent(agent: { _id: string; username: string }, departments: string[] = []): Promise<void> {
		const { _id: agentId, username } = agent;
		const savedDepartments = (await LivechatDepartmentAgents.findByAgentId(agentId).toArray()).map((d) => d.departmentId);

		const incNumAgents = (_id: string, numAgents: number) => this.updateOne({ _id }, { $inc: { numAgents } });
		// remove other departments
		const deps = difference(savedDepartments, departments).map(async (departmentId) => {
			// Migrate func
			await LivechatDepartmentAgents.removeByDepartmentIdAndAgentId(departmentId, agentId);
			await incNumAgents(departmentId, -1);
		});

		await Promise.all(deps);

		const promises = departments.map(async (departmentId) => {
			const dep = await this.findOneById(departmentId, {
				projection: { enabled: 1 },
			});
			if (!dep) {
				return;
			}

			const { enabled: departmentEnabled } = dep;
			// Migrate func
			const saveResult = await LivechatDepartmentAgents.saveAgent({
				agentId,
				departmentId,
				username,
				departmentEnabled,
				count: 0,
				order: 0,
			});

			if (saveResult.upsertedId) {
				await incNumAgents(departmentId, 1);
			}
		});

		await Promise.all(promises);
	}

	updateById(_id: string, update: Partial<ILivechatDepartment>): Promise<Document | UpdateResult> {
		return this.updateOne({ _id }, update);
	}

	updateNumAgentsById(_id: string, numAgents: number): Promise<Document | UpdateResult> {
		return this.updateOne({ _id }, { $set: { numAgents } });
	}

	findEnabledWithAgents(projection: FindOptions<ILivechatDepartment>['projection'] = {}): FindCursor<ILivechatDepartment> {
		const query = {
			numAgents: { $gt: 0 },
			enabled: true,
		};
		return this.find(query, projection && { projection });
	}

	async findEnabledWithAgentsAndBusinessUnit(
		_: any,
		projection: FindOptions<ILivechatDepartment>['projection'] = {},
	): Promise<FindCursor<ILivechatDepartment>> {
		const query = {
			numAgents: { $gt: 0 },
			enabled: true,
		};
		return this.find(query, projection && { projection });
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

	findActiveByUnitIds(unitIds: string[], options: FindOptions<ILivechatDepartment> = {}): FindCursor<ILivechatDepartment> {
		const query = {
			enabled: true,
			numAgents: { $gt: 0 },
			parentId: {
				$exists: true,
				$in: unitIds,
			},
		};

		return this.find(query, options);
	}
}

const difference = <T>(arr: T[], arr2: T[]): T[] => {
	return arr.filter((a) => !arr2.includes(a));
};
