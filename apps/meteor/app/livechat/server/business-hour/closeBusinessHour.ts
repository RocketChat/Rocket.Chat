import type { ILivechatBusinessHour, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { makeFunction } from '@rocket.chat/patch-injection';

import { businessHourLogger } from '../lib/logger';
import { makeAgentsUnavailableBasedOnBusinessHour } from './Helper';
import { getAgentIdsForBusinessHour } from './getAgentIdsForBusinessHour';

export const closeBusinessHourByAgentIds = async (
	businessHourId: ILivechatBusinessHour['_id'],
	agentIds: IUser['_id'][],
): Promise<void> => {
	businessHourLogger.debug({
		msg: 'Closing business hour',
		businessHour: businessHourId,
		totalAgents: agentIds.length,
		top10AgentIds: agentIds.slice(0, 10),
	});
	await Users.removeBusinessHourByAgentIds(agentIds, businessHourId);

	await makeAgentsUnavailableBasedOnBusinessHour();
};

export const closeBusinessHour = makeFunction(async (businessHour: Pick<ILivechatBusinessHour, '_id' | 'type'>): Promise<void> => {
	const agentIds = await getAgentIdsForBusinessHour();
	return closeBusinessHourByAgentIds(businessHour._id, agentIds);
});
