import type { AggregationCursor, FindCursor, Document, ModifyResult, UpdateResult } from 'mongodb';
import type { ILivechatAgentActivity, IServiceHistory } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatAgentActivityModel extends IBaseModel<ILivechatAgentActivity> {
	findOneByAgendIdAndDate(agentId: string, date: ILivechatAgentActivity['date']): Promise<ILivechatAgentActivity | null>;

	createOrUpdate(
		data: Partial<Pick<ILivechatAgentActivity, 'date' | 'agentId' | 'lastStartedAt'>>,
	): Promise<ModifyResult<ILivechatAgentActivity> | undefined>;

	updateLastStoppedAt(
		params: Pick<ILivechatAgentActivity, 'date' | 'agentId' | 'lastStoppedAt' | 'availableTime'>,
	): Promise<UpdateResult | Document>;

	updateServiceHistory(
		params: Pick<ILivechatAgentActivity, 'date' | 'agentId'> & { serviceHistory: IServiceHistory },
	): Promise<UpdateResult | Document>;

	findOpenSessions(): FindCursor<ILivechatAgentActivity>;

	findAllAverageAvailableServiceTime(params: { date: Date; departmentId: string }): Promise<ILivechatAgentActivity[]>;

	findAvailableServiceTimeHistory(params: {
		start: string;
		end: string;
		fullReport: boolean;
		onlyCount: boolean;
		options: any;
	}): AggregationCursor<ILivechatAgentActivity>;
}
