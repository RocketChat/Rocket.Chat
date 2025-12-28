import type { ILivechatAgentActivity, IServiceHistory } from '@rocket.chat/core-typings';
import type { AggregationCursor, FindCursor, Document, WithId, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatAgentActivityModel extends IBaseModel<ILivechatAgentActivity> {
	findOneByAgendIdAndDate(agentId: string, date: ILivechatAgentActivity['date']): Promise<ILivechatAgentActivity | null>;

	createOrUpdate(
		data: Partial<Pick<ILivechatAgentActivity, 'date' | 'agentId' | 'lastStartedAt'>>,
	): Promise<null | WithId<ILivechatAgentActivity> | undefined>;

	updateLastStoppedAt(
		params: Pick<ILivechatAgentActivity, 'date' | 'agentId' | 'lastStoppedAt' | 'availableTime'>,
	): Promise<UpdateResult | Document>;

	updateServiceHistory(
		params: Pick<ILivechatAgentActivity, 'date' | 'agentId'> & { serviceHistory: IServiceHistory },
	): Promise<UpdateResult | Document>;

	findOpenSessions(): FindCursor<ILivechatAgentActivity>;

	findAllAverageAvailableServiceTime(params: { date: Date; departmentId?: string }): Promise<
		{
			averageAvailableServiceTimeInSeconds: number;
		}[]
	>;

	findAvailableServiceTimeHistory(p: {
		start: string;
		end: string;
		fullReport: boolean;
		onlyCount: true;
		options?: { sort?: Record<string, number>; offset?: number; count?: number };
	}): AggregationCursor<{ total: number }>;

	findAvailableServiceTimeHistory(p: {
		start: string;
		end: string;
		fullReport: boolean;
		onlyCount?: false;
		options?: { sort?: Record<string, number>; offset?: number; count?: number };
	}): AggregationCursor<ILivechatAgentActivity>;
}
