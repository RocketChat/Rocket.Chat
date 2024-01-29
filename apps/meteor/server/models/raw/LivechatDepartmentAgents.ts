import type { ILivechatDepartmentAgents, RocketChatRecordDeleted, IUser } from '@rocket.chat/core-typings';
import type { FindPaginated, ILivechatDepartmentAgentsModel } from '@rocket.chat/model-typings';
import { Users } from '@rocket.chat/models';
import type {
	Collection,
	FindCursor,
	Db,
	Filter,
	FindOptions,
	Document,
	UpdateResult,
	DeleteResult,
	IndexDescription,
	SortDirection,
} from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LivechatDepartmentAgentsRaw extends BaseRaw<ILivechatDepartmentAgents> implements ILivechatDepartmentAgentsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatDepartmentAgents>>) {
		super(db, 'livechat_department_agents', trash);
	}

	protected modelIndexes(): Array<IndexDescription> {
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

	findUsersInQueue(usersList: string[]): FindCursor<ILivechatDepartmentAgents>;

	findUsersInQueue(usersList: string[], options: FindOptions<ILivechatDepartmentAgents>): FindCursor<ILivechatDepartmentAgents>;

	findUsersInQueue<P extends Document>(
		usersList: string[],
		options: FindOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): FindCursor<P>;

	findUsersInQueue<P extends Document>(
		usersList: string[],
		options?:
			| undefined
			| FindOptions<ILivechatDepartmentAgents>
			| FindOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): FindCursor<ILivechatDepartmentAgents> | FindCursor<P> {
		const query: Filter<ILivechatDepartmentAgents> = {};

		if (Array.isArray(usersList) && usersList.length) {
			// TODO: Remove
			query.username = {
				$in: usersList,
			};
		}

		if (options === undefined) {
			return this.find(query);
		}

		return this.find(query, options);
	}

	findByAgentIds(agentIds: string[], options?: FindOptions<ILivechatDepartmentAgents>): FindCursor<ILivechatDepartmentAgents> {
		return this.find({ agentId: { $in: agentIds } }, options);
	}

	findByAgentId(agentId: string, options?: FindOptions<ILivechatDepartmentAgents>): FindCursor<ILivechatDepartmentAgents> {
		return this.find({ agentId }, options);
	}

	findAgentsByDepartmentId(departmentId: string): FindPaginated<FindCursor<ILivechatDepartmentAgents>>;

	findAgentsByDepartmentId(
		departmentId: string,
		options: FindOptions<ILivechatDepartmentAgents>,
	): FindPaginated<FindCursor<ILivechatDepartmentAgents>>;

	findAgentsByDepartmentId<P extends Document>(
		departmentId: string,
		options: FindOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): FindPaginated<FindCursor<P>>;

	findAgentsByDepartmentId(
		departmentId: string,
		options?: undefined | FindOptions<ILivechatDepartmentAgents>,
	): FindPaginated<FindCursor<ILivechatDepartmentAgents>> {
		const query = { departmentId };

		if (options === undefined) {
			return this.findPaginated(query);
		}

		return this.findPaginated(query, options);
	}

	findActiveDepartmentsByAgentId(agentId: string): FindCursor<ILivechatDepartmentAgents>;

	findActiveDepartmentsByAgentId(agentId: string, options: FindOptions<ILivechatDepartmentAgents>): FindCursor<ILivechatDepartmentAgents>;

	findActiveDepartmentsByAgentId<P extends Document>(
		agentId: string,
		options: FindOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): FindCursor<P>;

	findActiveDepartmentsByAgentId<P extends Document>(
		agentId: string,
		options?:
			| undefined
			| FindOptions<ILivechatDepartmentAgents>
			| FindOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): FindCursor<ILivechatDepartmentAgents> | FindCursor<P> {
		const query = {
			agentId,
			departmentEnabled: true,
		};

		if (options === undefined) {
			return this.find(query);
		}

		return this.find(query, options);
	}

	findByDepartmentIds(departmentIds: string[], options = {}): FindCursor<ILivechatDepartmentAgents> {
		return this.find({ departmentId: { $in: departmentIds } }, options);
	}

	async findAgentsByAgentIdAndBusinessHourId(_agentId: string, _businessHourId: string): Promise<ILivechatDepartmentAgents[]> {
		return [];
	}

	setDepartmentEnabledByDepartmentId(departmentId: string, departmentEnabled: boolean): Promise<Document | UpdateResult> {
		return this.updateMany({ departmentId }, { $set: { departmentEnabled } });
	}

	removeByDepartmentId(departmentId: string): Promise<DeleteResult> {
		return this.deleteOne({ departmentId });
	}

	findByDepartmentId(departmentId: string, options?: FindOptions<ILivechatDepartmentAgents>): FindCursor<ILivechatDepartmentAgents> {
		return this.find({ departmentId }, options);
	}

	findOneByAgentIdAndDepartmentId(
		agentId: string,
		departmentId: string,
		options?: FindOptions<ILivechatDepartmentAgents>,
	): Promise<ILivechatDepartmentAgents | null> {
		return this.findOne({ agentId, departmentId }, options);
	}

	saveAgent(agent: {
		agentId: string;
		departmentId: string;
		username: string;
		departmentEnabled: boolean;
		count: number;
		order: number;
	}): Promise<Document | UpdateResult> {
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

	async removeByAgentId(agentId: string): Promise<void> {
		await this.deleteMany({ agentId });
	}

	async removeByDepartmentIdAndAgentId(departmentId: string, agentId: string): Promise<void> {
		await this.deleteMany({ departmentId, agentId });
	}

	async getNextAgentForDepartment(
		departmentId: string,
		isLivechatEnabledWhenAgentIdle?: boolean,
		ignoreAgentId?: string,
		extraQuery?: Filter<IUser>,
	): Promise<{ agentId: string; username: string } | null | undefined> {
		const agents = await this.findByDepartmentId(departmentId).toArray();

		console.log('agents', agents);
		if (agents.length === 0) {
			return;
		}

		const onlineUsers = await Users.findOnlineUserFromList(
			agents.map((agent) => agent.username),
			isLivechatEnabledWhenAgentIdle,
		).toArray();
		
		console.log('onlineUsers', onlineUsers);
		const onlineUsernames = onlineUsers.map((user) => user.username).filter(isStringValue);

		// get fully booked agents, to ignore them from the query
		const currentUnavailableAgents = (await Users.getUnavailableAgents(departmentId, extraQuery)).map((u) => u.username);

		console.log('currentUnavailableAgents', currentUnavailableAgents);
		const query: Filter<ILivechatDepartmentAgents> = {
			departmentId,
			username: {
				$in: onlineUsernames,
				$nin: currentUnavailableAgents,
			},
			...(ignoreAgentId && { agentId: { $ne: ignoreAgentId } }),
		};

		const sort: { [k: string]: SortDirection } = {
			count: 1,
			order: 1,
			username: 1,
		};
		const update = {
			$inc: {
				count: 1,
			},
		};

		console.log(JSON.stringify(query), JSON.stringify(sort), JSON.stringify(update));
		const agent = await this.findOneAndUpdate(query, update, { sort, returnDocument: 'after' });
		if (agent?.value) {
			return {
				agentId: agent.value.agentId,
				username: agent.value.username,
			};
		}
		return null;
	}

	async checkOnlineForDepartment(departmentId: string): Promise<boolean> {
		const agents = await this.findByDepartmentId(departmentId).toArray();

		if (agents.length === 0) {
			return false;
		}

		const onlineUser = await Users.findOneOnlineAgentByUserList(agents.map((agent) => agent.username));

		return Boolean(onlineUser);
	}

	async getOnlineForDepartment(
		departmentId: string,
		isLivechatEnabledWhenAgentIdle?: boolean,
	): Promise<FindCursor<ILivechatDepartmentAgents> | undefined> {
		const agents = await this.findByDepartmentId(departmentId).toArray();

		if (agents.length === 0) {
			return;
		}

		const onlineUsers = await Users.findOnlineUserFromList(
			agents.map((a) => a.username),
			isLivechatEnabledWhenAgentIdle,
		).toArray();

		const onlineUsernames = onlineUsers.map((user) => user.username).filter(isStringValue);

		const query = {
			departmentId,
			username: {
				$in: onlineUsernames,
			},
		};

		return this.find(query);
	}

	async getBotsForDepartment(departmentId: string): Promise<undefined | FindCursor<ILivechatDepartmentAgents>> {
		const agents = await this.findByDepartmentId(departmentId).toArray();

		if (agents.length === 0) {
			return;
		}

		const botUsers = await Users.findBotAgents(agents.map((a) => a.username)).toArray();
		const botUsernames = botUsers.map((user) => user.username).filter(isStringValue);

		const query = {
			departmentId,
			username: {
				$in: botUsernames,
			},
		};

		return this.find(query);
	}

	async getNextBotForDepartment(departmentId: string, ignoreAgentId?: string): Promise<{ agentId: string; username: string } | undefined> {
		const agents = await this.findByDepartmentId(departmentId).toArray();

		if (agents.length === 0) {
			return;
		}

		const botUsers = await Users.findBotAgents(agents.map((a) => a.username)).toArray();
		const botUsernames = botUsers.map((user) => user.username).filter(isStringValue);

		const query = {
			departmentId,
			username: {
				$in: botUsernames,
			},
			...(ignoreAgentId && { agentId: { $ne: ignoreAgentId } }),
		};

		const sort: { [k: string]: SortDirection } = {
			count: 1,
			order: 1,
			username: 1,
		};
		const update = {
			$inc: {
				count: 1,
			},
		};

		const bot = await this.findOneAndUpdate(query, update, { sort, returnDocument: 'after' });
		if (bot?.value) {
			return {
				agentId: bot.value.agentId,
				username: bot.value.username,
			};
		}
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
		return this.col.countDocuments({ departmentId });
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
}

const isStringValue = (value: any): value is string => typeof value === 'string';
