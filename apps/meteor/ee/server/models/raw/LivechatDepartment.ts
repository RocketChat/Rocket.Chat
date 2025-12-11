import type { ILivechatDepartment, RocketChatRecordDeleted, LivechatDepartmentDTO } from '@rocket.chat/core-typings';
import type { ILivechatDepartmentModel } from '@rocket.chat/model-typings';
import { LivechatDepartmentRaw } from '@rocket.chat/models';
import type {
	Collection,
	DeleteResult,
	Document,
	Filter,
	FindCursor,
	FindOptions,
	UpdateFilter,
	UpdateResult,
	Db,
	AggregationCursor,
} from 'mongodb';

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
		findEnabledWithAgentsAndBusinessUnit<T extends Document = ILivechatDepartment>(
			businessUnit?: string,
			projection?: FindOptions<T>['projection'],
		): FindCursor<T>;
		findByParentId(parentId: string, options?: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment>;
		findAgentsByBusinessHourId(businessHourId: string): AggregationCursor<{ agentIds: string[] }>;
	}
}

export class LivechatDepartmentEE extends LivechatDepartmentRaw implements ILivechatDepartmentModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatDepartment>>) {
		super(db, trash);
	}

	override async removeDepartmentFromForwardListById(departmentId: string): Promise<void> {
		await this.updateMany({ departmentsAllowedToForward: departmentId }, { $pull: { departmentsAllowedToForward: departmentId } });
	}

	override unfilteredFind(query: Filter<ILivechatDepartment>, options: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment> {
		return this.col.find(query, options);
	}

	override unfilteredFindOne(
		query: Filter<ILivechatDepartment>,
		options: FindOptions<ILivechatDepartment>,
	): Promise<ILivechatDepartment | null> {
		return this.col.findOne(query, options);
	}

	override unfilteredUpdate(
		query: Filter<ILivechatDepartment>,
		update: UpdateFilter<ILivechatDepartment>,
		options: FindOptions<ILivechatDepartment>,
	): Promise<UpdateResult> {
		return this.col.updateOne(query, update, options);
	}

	override unfilteredRemove(query: Filter<ILivechatDepartment>): Promise<DeleteResult> {
		return this.col.deleteOne(query);
	}

	override createOrUpdateDepartment(_id: string | null, data: LivechatDepartmentDTO): Promise<ILivechatDepartment> {
		return super.createOrUpdateDepartment(_id, { ...data, type: 'd' });
	}

	override removeParentAndAncestorById(id: string): Promise<UpdateResult | Document> {
		return this.updateMany({ parentId: id }, { $unset: { parentId: 1 }, $pull: { ancestors: id } });
	}

	override findActiveByUnitIds<T extends Document = ILivechatDepartment>(unitIds: string[], options: FindOptions<T> = {}): FindCursor<T> {
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

	override findEnabledWithAgentsAndBusinessUnit<T extends Document = ILivechatDepartment>(
		businessUnit?: string,
		projection?: FindOptions<T>['projection'],
	): FindCursor<T> {
		if (!businessUnit) {
			return super.findEnabledWithAgents<T>(projection);
		}

		return this.findActiveByUnitIds<T>([businessUnit], { projection });
	}

	override findByParentId(parentId: string, options?: FindOptions<ILivechatDepartment>): FindCursor<ILivechatDepartment> {
		return this.col.find({ parentId }, options);
	}

	override findAgentsByBusinessHourId(businessHourId: string): AggregationCursor<{ agentIds: string[] }> {
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
