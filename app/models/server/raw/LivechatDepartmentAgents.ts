import { Cursor, FilterQuery, WithoutProjection, FindOneOptions } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ILivechatDepartmentAgents } from '../../../../definition/ILivechatDepartmentAgents';

export class LivechatDepartmentAgentsRaw extends BaseRaw<ILivechatDepartmentAgents> {
	findUsersInQueue(usersList: string[]): Cursor<ILivechatDepartmentAgents>;

	findUsersInQueue(usersList: string[], options: WithoutProjection<FindOneOptions<ILivechatDepartmentAgents>>): Cursor<ILivechatDepartmentAgents>;

	findUsersInQueue<P>(usersList: string[], options: FindOneOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>): Cursor<P>;

	findUsersInQueue<P>(usersList: string[], options?: undefined | WithoutProjection<FindOneOptions<ILivechatDepartmentAgents>> | FindOneOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>): Cursor<ILivechatDepartmentAgents> | Cursor<P> {
		const query: FilterQuery<ILivechatDepartmentAgents> = {};

		if (Array.isArray(usersList) && usersList.length) { // TODO: Remove
			query.username = {
				$in: usersList,
			};
		}

		if (options === undefined) {
			return this.find(query);
		}

		return this.find(query, options);
	}

	findByAgentId(agentId: string): Cursor<ILivechatDepartmentAgents> {
		return this.find({ agentId });
	}

	findAgentsByDepartmentId(departmentId: string): Cursor<ILivechatDepartmentAgents>;

	findAgentsByDepartmentId(departmentId: string, options: WithoutProjection<FindOneOptions<ILivechatDepartmentAgents>>): Cursor<ILivechatDepartmentAgents>;

	findAgentsByDepartmentId<P>(departmentId: string, options: FindOneOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>): Cursor<P>;

	findAgentsByDepartmentId<P>(departmentId: string, options?: undefined | WithoutProjection<FindOneOptions<ILivechatDepartmentAgents>> | FindOneOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>): Cursor<ILivechatDepartmentAgents> | Cursor<P> {
		const query = { departmentId };

		if (options === undefined) {
			return this.find(query);
		}

		return this.find(query, options);
	}


	findActiveDepartmentsByAgentId(agentId: string): Cursor<ILivechatDepartmentAgents>;

	findActiveDepartmentsByAgentId(agentId: string, options: WithoutProjection<FindOneOptions<ILivechatDepartmentAgents>>): Cursor<ILivechatDepartmentAgents>;

	findActiveDepartmentsByAgentId<P>(agentId: string, options: FindOneOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>): Cursor<P>;

	findActiveDepartmentsByAgentId<P>(agentId: string, options?: undefined | WithoutProjection<FindOneOptions<ILivechatDepartmentAgents>> | FindOneOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>): Cursor<ILivechatDepartmentAgents> | Cursor<P> {
		const query = {
			agentId,
			departmentEnabled: true,
		};

		if (options === undefined) {
			return this.find(query);
		}

		return this.find(query, options);
	}

	findByDepartmentIds(departmentIds: string[], options = {}): Cursor<ILivechatDepartmentAgents> {
		return this.find({ departmentId: { $in: departmentIds } }, options);
	}

	findAgentsByAgentIdAndBusinessHourId(_agentId: string, _businessHourId: string): [] { return []; }
}
