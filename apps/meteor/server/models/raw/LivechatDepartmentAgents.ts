import type { ILivechatDepartmentAgents, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { FindPaginated, ILivechatDepartmentAgentsModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, Filter, FindOptions } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class LivechatDepartmentAgentsRaw extends BaseRaw<ILivechatDepartmentAgents> implements ILivechatDepartmentAgentsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatDepartmentAgents>>) {
		super(db, 'livechat_department_agents', trash);
	}

	findUsersInQueue(usersList: string[]): FindCursor<ILivechatDepartmentAgents>;

	findUsersInQueue(usersList: string[], options: FindOptions<ILivechatDepartmentAgents>): FindCursor<ILivechatDepartmentAgents>;

	findUsersInQueue<P>(
		usersList: string[],
		options: FindOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): FindCursor<P>;

	findUsersInQueue<P>(
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

	findByAgentId(agentId: string): FindCursor<ILivechatDepartmentAgents> {
		return this.find({ agentId });
	}

	findAgentsByDepartmentId(departmentId: string): FindPaginated<FindCursor<ILivechatDepartmentAgents>>;

	findAgentsByDepartmentId(
		departmentId: string,
		options: FindOptions<ILivechatDepartmentAgents>,
	): FindPaginated<FindCursor<ILivechatDepartmentAgents>>;

	findAgentsByDepartmentId<P>(
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

	findActiveDepartmentsByAgentId<P>(
		agentId: string,
		options: FindOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): FindCursor<P>;

	findActiveDepartmentsByAgentId<P>(
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

	findAgentsByAgentIdAndBusinessHourId(_agentId: string, _businessHourId: string): [] {
		return [];
	}
}
