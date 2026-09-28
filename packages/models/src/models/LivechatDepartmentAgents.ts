import type { AvailableAgentsAggregation, ILivechatDepartmentAgents, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type {
	FindPaginated,
	ILivechatDepartmentAgentsModel,
	DocumentWithProjection,
	FindOptionsWithProjection,
} from '@rocket.chat/model-typings';
import type {
	Collection,
	FindCursor,
	Db,
	Filter,
	Document,
	UpdateResult,
	DeleteResult,
	IndexDescription,
	SortDirection,
	AggregationCursor,
} from 'mongodb';

import { Users } from '../index';
import { BaseRaw } from './BaseRaw';

export class LivechatDepartmentAgentsRaw extends BaseRaw<ILivechatDepartmentAgents> implements ILivechatDepartmentAgentsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatDepartmentAgents>>) {
		super(db, 'livechat_department_agents', trash);
	}

	protected override modelIndexes(): Array<IndexDescription> {
		return [
			{
				key: {
					departmentId: 1,
				},
			},
			{
				key: {
					departmentEnabled: 1,
				},
			},
			{
				key: {
					agentId: 1,
				},
			},
			{
				key: {
					username: 1,
				},
			},
		];
	}

	findByAgentIds<T extends Document = ILivechatDepartmentAgents, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		agentIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>({ agentId: { $in: agentIds } }, options);
	}

	findByAgentId<T extends Document = ILivechatDepartmentAgents, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		agentId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>({ agentId }, options);
	}

	findAgentsByDepartmentId<
		P extends Document = ILivechatDepartmentAgents,
		O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>,
	>(departmentId: string, options?: O): FindPaginated<FindCursor<DocumentWithProjection<P, O>>> {
		const query = { departmentId };

		if (options === undefined) {
			return this.findPaginated<P, O>(query);
		}

		return this.findPaginated<P, O>(query, options);
	}

	findByDepartmentIds(departmentIds: string[], options = {}): FindCursor<ILivechatDepartmentAgents> {
		return this.find({ departmentId: { $in: departmentIds } }, options);
	}

	setDepartmentEnabledByDepartmentId(departmentId: string, departmentEnabled: boolean): Promise<Document | UpdateResult> {
		return this.updateMany({ departmentId }, { $set: { departmentEnabled } });
	}

	removeByDepartmentId(departmentId: string): Promise<DeleteResult> {
		return this.deleteMany({ departmentId });
	}

	findByDepartmentId<T extends Document = ILivechatDepartmentAgents, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		departmentId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>({ departmentId }, options);
	}

	findOneByAgentIdAndDepartmentId<
		T extends Document = ILivechatDepartmentAgents,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(agentId: string, departmentId: string, options?: O): Promise<DocumentWithProjection<T, O> | null> {
		return this.findOne<T, O>({ agentId, departmentId }, options);
	}

	saveAgent(agent: {
		agentId: string;
		departmentId: string;
		username: string;
		departmentEnabled: boolean;
		count: number;
		order: number;
	}): Promise<UpdateResult> {
		return this.updateOne(
			{
				agentId: agent.agentId,
				departmentId: agent.departmentId,
			},
			{
				$set: {
					username: agent.username,
					departmentEnabled: agent.departmentEnabled,
					count: parseInt(`${agent.count}`),
					order: parseInt(`${agent.order}`),
				},
			},
			{ upsert: true },
		);
	}

	async removeByAgentId(agentId: string): Promise<DeleteResult> {
		return this.deleteMany({ agentId });
	}

	async getNextAgentForDepartment(
		departmentId: ILivechatDepartmentAgents['departmentId'],
		isLivechatEnabledWhenAgentIdle?: boolean,
		ignoreAgentId?: ILivechatDepartmentAgents['agentId'],
		extraQuery?: Filter<AvailableAgentsAggregation>,
		acceptChatsWithNoAgents?: boolean,
	): Promise<Pick<ILivechatDepartmentAgents, '_id' | 'agentId' | 'departmentId' | 'username'> | null | undefined> {
		const agents = await this.findByDepartmentId(departmentId).toArray();

		if (agents.length === 0) {
			return;
		}

		const onlineUsers = await Users.findOnlineUserFromList(
			agents.map((agent) => agent.username),
			isLivechatEnabledWhenAgentIdle,
			acceptChatsWithNoAgents,
		).toArray();

		const onlineUsernames = onlineUsers.map((user) => user.username).filter(isStringValue);

		// get fully booked agents, to ignore them from the query
		const currentUnavailableAgents = (
			await Users.getUnavailableAgents(departmentId, extraQuery, isLivechatEnabledWhenAgentIdle, acceptChatsWithNoAgents)
		).map((u) => u.username);

		const query: Filter<ILivechatDepartmentAgents> = {
			departmentId,
			username: {
				$in: onlineUsernames,
				$nin: currentUnavailableAgents,
			},
			...(ignoreAgentId && { agentId: { $ne: ignoreAgentId } }),
		};

		const update = {
			$inc: {
				count: 1,
			},
		};

		const sort: { [k: string]: SortDirection } = {
			count: 1,
			order: 1,
			username: 1,
		};

		const projection = {
			_id: 1,
			agentId: 1,
			departmentId: 1,
			username: 1,
		} as const;

		return this.findOneAndUpdate(query, update, { sort, projection, returnDocument: 'after' });
	}

	async countBotsForDepartment(departmentId: string): Promise<number> {
		const agents = await this.findByDepartmentId(departmentId, { projection: { username: 1 } }).toArray();

		if (agents.length === 0) {
			return 0;
		}

		return Users.countBotAgents(agents.map((a) => a.username));
	}

	async getNextBotForDepartment(
		departmentId: ILivechatDepartmentAgents['departmentId'],
		ignoreAgentId?: ILivechatDepartmentAgents['agentId'],
	): Promise<Pick<ILivechatDepartmentAgents, '_id' | 'agentId' | 'departmentId' | 'username'> | null | undefined> {
		const agents = await this.findByDepartmentId(departmentId).toArray();

		if (!agents.length) {
			return;
		}

		const botUsernames = (await Users.findBotAgents(agents.map((a) => a.username)).toArray())
			.map((user) => user.username)
			.filter(isStringValue);

		const query = {
			departmentId,
			username: {
				$in: botUsernames,
			},
			...(ignoreAgentId && { agentId: { $ne: ignoreAgentId } }),
		};

		const update = {
			$inc: {
				count: 1,
			},
		};

		const sort: { [k: string]: SortDirection } = {
			count: 1,
			order: 1,
			username: 1,
		};

		const projection = {
			_id: 1,
			agentId: 1,
			departmentId: 1,
			username: 1,
		} as const;

		return this.findOneAndUpdate(query, update, { sort, projection, returnDocument: 'after' });
	}

	replaceUsernameOfAgentByUserId(userId: string, username: string): Promise<UpdateResult | Document> {
		const query = { agentId: userId };

		const update = {
			$set: {
				username,
			},
		};

		return this.updateMany(query, update);
	}

	countByDepartmentId(departmentId: string): Promise<number> {
		return this.countDocuments({ departmentId });
	}

	disableAgentsByDepartmentId(departmentId: string): Promise<UpdateResult | Document> {
		return this.updateMany({ departmentId }, { $set: { departmentEnabled: false } });
	}

	enableAgentsByDepartmentId(departmentId: string): Promise<UpdateResult | Document> {
		return this.updateMany({ departmentId }, { $set: { departmentEnabled: true } });
	}

	findAllAgentsConnectedToListOfDepartments(departmentIds: string[]): Promise<string[]> {
		return this.col.distinct('agentId', { departmentId: { $in: departmentIds }, departmentEnabled: true });
	}

	findByAgentsAndDepartmentId<
		T extends Document = ILivechatDepartmentAgents,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		agentsIds: ILivechatDepartmentAgents['agentId'][],
		departmentId: ILivechatDepartmentAgents['departmentId'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		return this.find<T, O>({ agentId: { $in: agentsIds }, departmentId }, options);
	}

	findDepartmentsOfAgent(agentId: string, enabled = false): AggregationCursor<ILivechatDepartmentAgents & { departmentName: string }> {
		return this.col.aggregate<ILivechatDepartmentAgents & { departmentName: string }>([
			{
				$match: {
					agentId,
					...(enabled && { departmentEnabled: true }),
				},
			},
			{
				$lookup: {
					from: 'rocketchat_livechat_department',
					localField: 'departmentId',
					foreignField: '_id',
					as: 'department',
				},
			},
			{ $unwind: '$department' },
			{
				$project: {
					_id: '$_id',
					agentId: '$agentId',
					departmentId: '$departmentId',
					departmentName: '$department.name',
					username: '$username',
					count: '$count',
					order: '$order',
					departmentEnabled: '$departmentEnabled',
					_updatedAt: '$_updatedAt',
				},
			},
		]);
	}
}

const isStringValue = (value: any): value is string => typeof value === 'string';
