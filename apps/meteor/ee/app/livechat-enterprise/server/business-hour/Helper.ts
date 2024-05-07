import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents, Users } from '@rocket.chat/models';

import { getAgentIdsForBusinessHour } from '../../../../../app/livechat/server/business-hour/getAgentIdsForBusinessHour';
import { businessHourLogger } from '../../../../../app/livechat/server/lib/logger';

export const getAgentIdsToHandle = async (businessHour: Pick<ILivechatBusinessHour, '_id' | 'type'>): Promise<string[]> => {
	if (businessHour.type === LivechatBusinessHourTypes.DEFAULT) {
		return getAgentIdsForBusinessHour();
	}
	const departmentIds = (
		await LivechatDepartment.findEnabledByBusinessHourId(businessHour._id, {
			projection: { _id: 1 },
		}).toArray()
	).map((dept) => dept._id);
	return (
		await LivechatDepartmentAgents.findByDepartmentIds(departmentIds, {
			projection: { agentId: 1 },
		}).toArray()
	).map((dept) => dept.agentId);
};

export const openBusinessHour = async (
	businessHour: Pick<ILivechatBusinessHour, '_id' | 'type'>,
	updateLivechatStatus = true,
): Promise<void> => {
	const agentIds = await getAgentIdsToHandle(businessHour);
	businessHourLogger.debug({
		msg: 'Opening business hour',
		businessHour: businessHour._id,
		totalAgents: agentIds.length,
		top10AgentIds: agentIds.slice(0, 10),
	});
	await Users.addBusinessHourByAgentIds(agentIds, businessHour._id);
	await Users.makeAgentsWithinBusinessHourAvailable(agentIds);

	if (updateLivechatStatus) {
		await Users.updateLivechatStatusBasedOnBusinessHours();
	}
};

export const removeBusinessHourByAgentIds = async (agentIds: string[], businessHourId: string): Promise<void> => {
	if (!agentIds.length) {
		return;
	}
	await Users.removeBusinessHourByAgentIds(agentIds, businessHourId);
	await Users.updateLivechatStatusBasedOnBusinessHours();
};
