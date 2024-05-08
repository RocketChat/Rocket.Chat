import type { ILivechatDepartment, RocketChatRecordDeleted, LivechatDepartmentDTO } from '@rocket.chat/core-typings';
import type { ILivechatDepartmentModel } from '@rocket.chat/model-typings';
import { LivechatUnit } from '@rocket.chat/models';
import type {
	Collection,
	DeleteResult,
	Document,
	Filter,
	FindCursor,
	FindOptions,
	UpdateFilter,
	UpdateResult,
	AggregationCursor,
} from 'mongodb';

import { LivechatDepartmentRaw } from '../../../../server/models/raw/LivechatDepartment';

declare module '@rocket.chat/model-typings' {
	interface ILivechatDepartmentModel {
		removeDepartmentFromForwardListById(departmentId: string): Promise<void>;
		unfilteredFind(query: Filter<ILivechatDepartment>, options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;
		unfilteredFindOne(query: Filter<ILivechatDepartment>, options: FindOptions<ILivechatDepartment>): Promise<ILivechatDepartment | null>;
		unfilteredUpdate(
			query: Filter<ILivechatDepartment>,
			update: UpdateFilter<ILivechatDepartment>,
			options: FindOptions<ILivechatDepartment>,
		): Promise<UpdateResult>;
		unfilteredRemove(query: Filter<ILivechatDepartment>): Promise<DeleteResult>;
		removeParentAndAncestorById(id: string): Promise<UpdateResult | Document>;
		findEnabledWithAgentsAndBusinessUnit(
			businessUnit: string,
			projection: FindOptions<ILivechatDepartment>['projection'],
		): Promise<FindCursor<ILivechatDepartment>>;
		findByParentId(parentId: string, options?: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;
		findAgentsByBusinessHourId(businessHourId: string): AggregationCursor<{ agentIds: string[] }>;
	}
}

export class LivechatDepartmentEE extends LivechatDepartmentRaw implements ILivechatDepartmentModel {
	constructor(trash?: Collection<RocketChatRecordDeleted<ILivechatDepartment>>) {
		super(trash);
	}

	async removeDepartmentFromForwardListById(departmentId: string): Promise<void> {
		await this.updateMany({ departmentsAllowedToForward: departmentId }, { $pull: { departmentsAllowedToForward: departmentId } });
	}

	unfilteredFind(query: Filter<ILivechatDepartment>, options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment> {
		return this.col.find(query, options);
	}

	unfilteredFindOne(query: Filter<ILivechatDepartment>, options: FindOptions<ILivechatDepartment>): Promise<ILivechatDepartment | null> {
		return this.col.findOne(query, options);
	}

	unfilteredUpdate(
		query: Filter<ILivechatDepartment>,
		update: UpdateFilter<ILivechatDepartment>,
		options: FindOptions<ILivechatDepartment>,
	): Promise<UpdateResult> {
		return this.col.updateOne(query, update, options);
	}

	unfilteredRemove(query: Filter<ILivechatDepartment>): Promise<DeleteResult> {
		return this.col.deleteOne(query);
	}

	createOrUpdateDepartment(_id: string | null, data: LivechatDepartmentDTO): Promise<ILivechatDepartment> {
		return super.createOrUpdateDepartment(_id, { ...data, type: 'd' });
	}

	removeParentAndAncestorById(id: string): Promise<UpdateResult | Document> {
		return this.updateMany({ parentId: id }, { $unset: { parentId: 1 }, $pull: { ancestors: id } });
	}

	async findEnabledWithAgentsAndBusinessUnit(
		businessUnit: string,
		projection: FindOptions<ILivechatDepartment>['projection'],
	): Promise<FindCursor<ILivechatDepartment>> {
		if (!businessUnit) {
			return super.findEnabledWithAgents(projection);
		}
		const unit = await LivechatUnit.findOneById(businessUnit, { projection: { _id: 1 } });
		if (!unit) {
			throw new Meteor.Error('error-unit-not-found', `Error! No Active Business Unit found with id: ${businessUnit}`);
		}

		return super.findActiveByUnitIds([businessUnit], { projection });
	}

	findByParentId(parentId: string, options?: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment> {
		return this.col.find({ parentId }, options);
	}

	findAgentsByBusinessHourId(businessHourId: string): AggregationCursor<{ agentIds: string[] }> {
		return this.col.aggregate<{ agentIds: string[] }>([
			[
				{
					$match: {
						businessHourId,
					},
				},
				{
					$lookup: {
						from: 'rocketchat_livechat_department_agents',
						localField: '_id',
						foreignField: 'departmentId',
						as: 'agents',
					},
				},
				{
					$unwind: '$agents',
				},
				{
					$group: {
						_id: null,
						agentIds: {
							$addToSet: '$agents.agentId',
						},
					},
				},
			],
		]);
	}
}
