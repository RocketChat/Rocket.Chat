import { LivechatDepartment, LivechatDepartmentAgents, Users } from '../../../../../app/models/server/raw';
import { LivechatBussinessHourTypes } from '../../../../../definition/ILivechatBusinessHour';

const getAllAgentIdsWithoutDepartment = async (): Promise<string[]> => {
	const agentIdsWithDepartment = (await LivechatDepartmentAgents.find({}, { fields: { agentId: 1 } }).toArray()).map((dept: any) => dept.agentId);
	const agentIdsWithoutDepartment = (await Users.findUsersInRolesWithQuery('livechat-agent', {
		_id: { $nin: agentIdsWithDepartment },
	}, { fields: { _id: 1 } }).toArray()).map((user: any) => user._id);
	return agentIdsWithoutDepartment;
};

const getAgentIdsToHandle = async (businessHour: Record<string, any>): Promise<string[]> => {
	const departmentIds = (await LivechatDepartment.findEnabledByBusinessHourId(businessHour._id, { fields: { _id: 1 } }).toArray()).map((dept: any) => dept._id);
	const agentIds = (await LivechatDepartmentAgents.findByDepartmentIds(departmentIds, { fields: { agentId: 1 } }).toArray()).map((dept: any) => dept.agentId);
	if (businessHour.type === LivechatBussinessHourTypes.CUSTOM) {
		return agentIds;
	}
	return getAllAgentIdsWithoutDepartment();
};

export const openBusinessHour = async (businessHour: Record<string, any>): Promise<void> => {
	const agentIds: string[] = await getAgentIdsToHandle(businessHour);
	await Users.addBusinessHourByAgentIds(agentIds, businessHour._id);
	return Users.updateLivechatStatusBasedOnBusinessHours();
};

export const closeBusinessHour = async (businessHour: Record<string, any>): Promise<void> => {
	const agentIds: string[] = await getAgentIdsToHandle(businessHour);
	await Users.removeBusinessHourByAgentIds(agentIds, businessHour._id);
	return Users.updateLivechatStatusBasedOnBusinessHours();
};

export const removeBusinessHourByAgentIds = async (agentIds: string[], businessHourId: string): Promise<void> => {
	if (!agentIds.length) {
		return;
	}
	await Users.removeBusinessHourByAgentIds(agentIds, businessHourId);
	return Users.updateLivechatStatusBasedOnBusinessHours();
};
