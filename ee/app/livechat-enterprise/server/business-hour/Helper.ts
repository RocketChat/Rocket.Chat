import { Meteor } from 'meteor/meteor';
import moment from 'moment-timezone';

import {
	LivechatBusinessHours,
	LivechatDepartment,
	LivechatDepartmentAgents,
	Users,
} from '../../../../../app/models/server/raw';
import { ILivechatBusinessHour, LivechatBusinessHourTypes } from '../../../../../definition/ILivechatBusinessHour';

const getAllAgentIdsWithoutDepartment = async (): Promise<string[]> => {
	const agentIdsWithDepartment = (await LivechatDepartmentAgents.find({}, { fields: { agentId: 1 } }).toArray()).map((dept: any) => dept.agentId);
	const agentIdsWithoutDepartment = (await Users.findUsersInRolesWithQuery('livechat-agent', {
		_id: { $nin: agentIdsWithDepartment },
	}, { fields: { _id: 1 } }).toArray()).map((user: any) => user._id);
	return agentIdsWithoutDepartment;
};

const getAgentIdsToHandle = async (businessHour: Record<string, any>): Promise<string[]> => {
	if (businessHour.type === LivechatBusinessHourTypes.DEFAULT) {
		return getAllAgentIdsWithoutDepartment();
	}
	const departmentIds = (await LivechatDepartment.findEnabledByBusinessHourId(businessHour._id, { fields: { _id: 1 } }).toArray()).map((dept: any) => dept._id);
	return (await LivechatDepartmentAgents.findByDepartmentIds(departmentIds, { fields: { agentId: 1 } }).toArray()).map((dept: any) => dept.agentId);
};

export const openBusinessHour = async (businessHour: Record<string, any>): Promise<void> => {
	const agentIds: string[] = await getAgentIdsToHandle(businessHour);
	await Users.addBusinessHourByAgentIds(agentIds, businessHour._id);
	Users.updateLivechatStatusBasedOnBusinessHours();
};

export const closeBusinessHour = async (businessHour: Record<string, any>): Promise<void> => {
	const agentIds: string[] = await getAgentIdsToHandle(businessHour);
	await Users.removeBusinessHourByAgentIds(agentIds, businessHour._id);
	Users.updateLivechatStatusBasedOnBusinessHours();
};

export const removeBusinessHourByAgentIds = async (agentIds: string[], businessHourId: string): Promise<void> => {
	if (!agentIds.length) {
		return;
	}
	await Users.removeBusinessHourByAgentIds(agentIds, businessHourId);
	Users.updateLivechatStatusBasedOnBusinessHours();
};

export const resetDefaultBusinessHourIfNeeded = async (): Promise<void> => {
	Meteor.call('license:isEnterprise', async (err: any, isEnterprise: any) => {
		if (err) {
			throw err;
		}
		if (isEnterprise) {
			return;
		}
		const defaultBusinessHour = await LivechatBusinessHours.findOneDefaultBusinessHour<Pick<ILivechatBusinessHour, '_id'>>({ projection: { _id: 1 } });
		if (!defaultBusinessHour) {
			return;
		}
		LivechatBusinessHours.update({ _id: defaultBusinessHour._id }, {
			$set: {
				timezone: {
					name: moment.tz.guess(),
					utc: String(moment().utcOffset() / 60),
				},
			},
		});
	});
};
