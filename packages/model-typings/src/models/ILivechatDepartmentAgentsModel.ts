import type { Cursor, WithoutProjection, FindOneOptions } from 'mongodb';
import type { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatDepartmentAgentsModel extends IBaseModel<ILivechatDepartmentAgents> {
	findUsersInQueue(usersList: string[]): Cursor<ILivechatDepartmentAgents>;

	findUsersInQueue(
		usersList: string[],
		options: WithoutProjection<FindOneOptions<ILivechatDepartmentAgents>>,
	): Cursor<ILivechatDepartmentAgents>;

	findUsersInQueue<P>(
		usersList: string[],
		options: FindOneOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): Cursor<P>;

	findUsersInQueue<P>(
		usersList: string[],
		options?:
			| undefined
			| WithoutProjection<FindOneOptions<ILivechatDepartmentAgents>>
			| FindOneOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): Cursor<ILivechatDepartmentAgents> | Cursor<P>;
	findByAgentId(agentId: string): Cursor<ILivechatDepartmentAgents>;
	findAgentsByDepartmentId(departmentId: string): Cursor<ILivechatDepartmentAgents>;

	findAgentsByDepartmentId(
		departmentId: string,
		options: WithoutProjection<FindOneOptions<ILivechatDepartmentAgents>>,
	): Cursor<ILivechatDepartmentAgents>;

	findAgentsByDepartmentId<P>(
		departmentId: string,
		options: FindOneOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): Cursor<P>;

	findAgentsByDepartmentId<P>(
		departmentId: string,
		options?:
			| undefined
			| WithoutProjection<FindOneOptions<ILivechatDepartmentAgents>>
			| FindOneOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): Cursor<ILivechatDepartmentAgents> | Cursor<P>;
	findActiveDepartmentsByAgentId(agentId: string): Cursor<ILivechatDepartmentAgents>;

	findActiveDepartmentsByAgentId(
		agentId: string,
		options: WithoutProjection<FindOneOptions<ILivechatDepartmentAgents>>,
	): Cursor<ILivechatDepartmentAgents>;

	findActiveDepartmentsByAgentId<P>(
		agentId: string,
		options: FindOneOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): Cursor<P>;

	findActiveDepartmentsByAgentId<P>(
		agentId: string,
		options?:
			| undefined
			| WithoutProjection<FindOneOptions<ILivechatDepartmentAgents>>
			| FindOneOptions<P extends ILivechatDepartmentAgents ? ILivechatDepartmentAgents : P>,
	): Cursor<ILivechatDepartmentAgents> | Cursor<P>;

	findByDepartmentIds(departmentIds: string[], options?: Record<string, any>): Cursor<ILivechatDepartmentAgents>;
	findAgentsByAgentIdAndBusinessHourId(_agentId: string, _businessHourId: string): [];
}
