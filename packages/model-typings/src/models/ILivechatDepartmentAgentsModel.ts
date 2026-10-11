import type { AvailableAgentsAggregation, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import type { DeleteResult, FindCursor, Document, UpdateResult, Filter, AggregationCursor } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ILivechatDepartmentAgentsModel extends IBaseModel<ILivechatDepartmentAgents> {
	findByAgentId<T extends Document = ILivechatDepartmentAgents, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		agentId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	findAgentsByDepartmentId<
		P extends Document = ILivechatDepartmentAgents,
		O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>,
	>(
		departmentId: string,
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<P, O>>>;

	findByDepartmentIds(departmentIds: string[], options?: Record<string, any>): FindCursor<ILivechatDepartmentAgents>;
	setDepartmentEnabledByDepartmentId(departmentId: string, departmentEnabled: boolean): Promise<Document | UpdateResult>;
	removeByDepartmentId(departmentId: string): Promise<DeleteResult>;
	findByDepartmentId<T extends Document = ILivechatDepartmentAgents, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		departmentId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findOneByAgentIdAndDepartmentId<
		T extends Document = ILivechatDepartmentAgents,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		agentId: string,
		departmentId: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	saveAgent(agent: Omit<ILivechatDepartmentAgents, '_id' | '_updatedAt'>): Promise<UpdateResult>;
	removeByAgentId(agentId: string): Promise<DeleteResult>;
	getNextAgentForDepartment(
		departmentId: ILivechatDepartmentAgents['departmentId'],
		isLivechatEnabledWhenAgentIdle?: boolean,
		ignoreAgentId?: ILivechatDepartmentAgents['agentId'],
		extraQuery?: Filter<AvailableAgentsAggregation>,
		acceptChatsWithNoAgents?: boolean,
	): Promise<Pick<ILivechatDepartmentAgents, '_id' | 'agentId' | 'departmentId' | 'username'> | null | undefined>;
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
	findByAgentIds<T extends Document = ILivechatDepartmentAgents, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		agentIds: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByAgentsAndDepartmentId<
		T extends Document = ILivechatDepartmentAgents,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		agentsIds: ILivechatDepartmentAgents['agentId'][],
		departmentId: ILivechatDepartmentAgents['departmentId'],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findDepartmentsOfAgent(agentId: string, enabled?: boolean): AggregationCursor<ILivechatDepartmentAgents & { departmentName: string }>;
}
