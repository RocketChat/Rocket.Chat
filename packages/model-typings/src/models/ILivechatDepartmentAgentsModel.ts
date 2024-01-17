import type { ILivechatDepartmentAgents, IUser } from '@rocket.chat/core-typings';
import type { DeleteResult, FindCursor, FindOptions, Document, UpdateResult, Filter } from 'mongodb';

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
	): FindCursor<ILivechatDepartmentAgents> | FindCursor<P>;

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
	saveAgent(agent: {
		agentId: string;
		departmentId: string;
		username: string;
		departmentEnabled: boolean;
		count: number;
		order: number;
	}): Promise<Document | UpdateResult>;
	removeByAgentId(agentId: string): Promise<void>;
	removeByDepartmentIdAndAgentId(departmentId: string, agentId: string): Promise<void>;
	getNextAgentForDepartment(
		departmentId: string,
		isLivechatEnabledWhenAgentIdle?: boolean,
		ignoreAgentId?: string,
		extraQuery?: Filter<IUser>,
	): Promise<{ agentId: string; username: string } | null | undefined>;
	checkOnlineForDepartment(departmentId: string): Promise<boolean>;
	getOnlineForDepartment(
		departmentId: string,
		isLivechatEnabledWhenAgentIdle?: boolean,
	): Promise<FindCursor<ILivechatDepartmentAgents> | undefined>;
	getBotsForDepartment(departmentId: string): Promise<undefined | FindCursor<ILivechatDepartmentAgents>>;
	getNextBotForDepartment(departmentId: string, ignoreAgentId?: string): Promise<{ agentId: string; username: string } | undefined>;
	replaceUsernameOfAgentByUserId(userId: string, username: string): Promise<UpdateResult | Document>;
	countByDepartmentId(departmentId: string): Promise<number>;
	disableAgentsByDepartmentId(departmentId: string): Promise<UpdateResult | Document>;
	enableAgentsByDepartmentId(departmentId: string): Promise<UpdateResult | Document>;
	findAllAgentsConnectedToListOfDepartments(departmentIds: string[]): Promise<string[]>;
}
