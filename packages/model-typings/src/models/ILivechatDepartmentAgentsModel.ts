import type { AvailableAgentsAggregation, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import type { DeleteResult, FindCursor, FindOptions, Document, UpdateResult, Filter, AggregationCursor } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface ILivechatDepartmentAgentsModel extends IBaseModel<ILivechatDepartmentAgents> {
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
	): FindCursor<ILivechatDepartmentAgents> | FindCursor<P>;
	findByAgentId(agentId: string, options?: FindOptions<ILivechatDepartmentAgents>): FindCursor<ILivechatDepartmentAgents>;

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
	): FindPaginated<FindCursor<ILivechatDepartmentAgents>>;

	findByDepartmentIds(departmentIds: string[], options?: Record<string, any>): FindCursor<ILivechatDepartmentAgents>;
	findAgentsByAgentIdAndBusinessHourId(_agentId: string, _businessHourId: string): Promise<ILivechatDepartmentAgents[]>;
	setDepartmentEnabledByDepartmentId(departmentId: string, departmentEnabled: boolean): Promise<Document | UpdateResult>;
	removeByDepartmentId(departmentId: string): Promise<DeleteResult>;
	findByDepartmentId(departmentId: string, options?: FindOptions<ILivechatDepartmentAgents>): FindCursor<ILivechatDepartmentAgents>;
	findOneByAgentIdAndDepartmentId(
		agentId: string,
		departmentId: string,
		options?: FindOptions<ILivechatDepartmentAgents>,
	): Promise<ILivechatDepartmentAgents | null>;
	findOneByAgentIdAndDepartmentId(agentId: string, departmentId: string): Promise<ILivechatDepartmentAgents | null>;
	saveAgent(agent: Omit<ILivechatDepartmentAgents, '_id' | '_updatedAt'>): Promise<UpdateResult>;
	removeByAgentId(agentId: string): Promise<DeleteResult>;
	removeByDepartmentIdAndAgentId(departmentId: string, agentId: string): Promise<void>;
	getNextAgentForDepartment(
		departmentId: ILivechatDepartmentAgents['departmentId'],
		isLivechatEnabledWhenAgentIdle?: boolean,
		ignoreAgentId?: ILivechatDepartmentAgents['agentId'],
		extraQuery?: Filter<AvailableAgentsAggregation>,
	): Promise<Pick<ILivechatDepartmentAgents, '_id' | 'agentId' | 'departmentId' | 'username'> | null | undefined>;
	checkOnlineForDepartment(departmentId: string): Promise<boolean>;
	getOnlineForDepartment(
		departmentId: string,
		isLivechatEnabledWhenAgentIdle?: boolean,
	): Promise<FindCursor<ILivechatDepartmentAgents> | undefined>;
	countOnlineForDepartment(departmentId: string, isLivechatEnabledWhenAgentIdle?: boolean): Promise<number>;
	getBotsForDepartment(departmentId: string): Promise<undefined | FindCursor<ILivechatDepartmentAgents>>;
	countBotsForDepartment(departmentId: string): Promise<number>;
	getNextBotForDepartment(
		departmentId: ILivechatDepartmentAgents['departmentId'],
		ignoreAgentId?: ILivechatDepartmentAgents['agentId'],
	): Promise<Pick<ILivechatDepartmentAgents, '_id' | 'agentId' | 'departmentId' | 'username'> | null | undefined>;
	replaceUsernameOfAgentByUserId(userId: string, username: string): Promise<UpdateResult | Document>;
	countByDepartmentId(departmentId: string): Promise<number>;
	disableAgentsByDepartmentId(departmentId: string): Promise<UpdateResult | Document>;
	enableAgentsByDepartmentId(departmentId: string): Promise<UpdateResult | Document>;
	findAllAgentsConnectedToListOfDepartments(departmentIds: string[]): Promise<string[]>;
	findByAgentIds(agentIds: string[], options?: FindOptions<ILivechatDepartmentAgents>): FindCursor<ILivechatDepartmentAgents>;
	findByAgentsAndDepartmentId(
		agentsIds: ILivechatDepartmentAgents['agentId'][],
		departmentId: ILivechatDepartmentAgents['departmentId'],
		options?: FindOptions<ILivechatDepartmentAgents>,
	): FindCursor<ILivechatDepartmentAgents>;
	findDepartmentsOfAgent(agentId: string, enabled?: boolean): AggregationCursor<ILivechatDepartmentAgents & { departmentName: string }>;
}
