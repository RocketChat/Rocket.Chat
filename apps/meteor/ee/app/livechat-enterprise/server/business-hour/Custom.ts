import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { LivechatDepartment, LivechatDepartmentAgents, Users } from '@rocket.chat/models';

import type { IBusinessHourType } from '../../../../../app/livechat/server/business-hour/AbstractBusinessHour';
import { AbstractBusinessHourType } from '../../../../../app/livechat/server/business-hour/AbstractBusinessHour';
import { businessHourManager } from '../../../../../app/livechat/server/business-hour';

type IBusinessHoursExtraProperties = {
	timezoneName: string;
	departmentsToApplyBusinessHour: string;
};

class CustomBusinessHour extends AbstractBusinessHourType implements IBusinessHourType {
	name = LivechatBusinessHourTypes.CUSTOM;

	async getBusinessHour(id: string): Promise<ILivechatBusinessHour | null> {
		if (!id) {
			return null;
		}

		const businessHour = await this.BusinessHourRepository.findOneById(id);
		if (!businessHour) {
			return null;
		}

		businessHour.departments = await LivechatDepartment.findByBusinessHourId(businessHour._id, {
			projection: { name: 1 },
		}).toArray();
		return businessHour;
	}

	async saveBusinessHour(businessHour: ILivechatBusinessHour & IBusinessHoursExtraProperties): Promise<ILivechatBusinessHour> {
		const existingBusinessHour = (await this.BusinessHourRepository.findOne(
			{ name: businessHour.name },
			{ projection: { _id: 1 } },
		)) as ILivechatBusinessHour;
		if (existingBusinessHour && existingBusinessHour._id !== businessHour._id) {
			throw new Error('error-business-hour-name-already-in-use');
		}
		const { timezoneName, departmentsToApplyBusinessHour, ...businessHourData } = businessHour;
		businessHourData.timezone = {
			name: timezoneName,
			utc: this.getUTCFromTimezone(timezoneName),
		};
		const departments = departmentsToApplyBusinessHour?.split(',').filter(Boolean) || [];
		const businessHourToReturn = { ...businessHourData, departmentsToApplyBusinessHour };
		delete businessHourData.departments;

		const businessHourId = await this.baseSaveBusinessHour(businessHourData);
		const currentDepartments = (
			await LivechatDepartment.findByBusinessHourId(businessHourId, {
				projection: { _id: 1 },
			}).toArray()
		).map((dept) => dept._id);
		const toRemove = [...currentDepartments.filter((dept) => !departments.includes(dept))];
		const toAdd = [...departments.filter((dept: string) => !currentDepartments.includes(dept))];

		await this.removeBusinessHourFromDepartmentsIfNeeded(businessHourId, toRemove);

		// Now will check if the department which we're currently adding to BH is not
		// associated with any other BH. If it is, then it will remove the old BH from all user's
		// cache. It will not add the new BH right now as it will be done in afterSaveBusinessHour.
		await this.removeBHFromPreviouslyConnectedDepartmentAgentsIfRequired(toAdd);

		await this.addBusinessHourToDepartmentsIfNeeded(businessHourId, toAdd);

		businessHourToReturn._id = businessHourId;
		return businessHourToReturn;
	}

	async removeBusinessHourById(businessHourId: string): Promise<void> {
		const businessHour = await this.BusinessHourRepository.findOneById(businessHourId, {});
		if (!businessHour) {
			return;
		}
		await this.BusinessHourRepository.removeById(businessHourId);
		await this.removeBusinessHourFromAgents(businessHourId);
		await LivechatDepartment.removeBusinessHourFromDepartmentsByBusinessHourId(businessHourId);
		this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
	}

	private async removeBusinessHourFromAgents(businessHourId: string): Promise<void> {
		const departmentIds = (
			await LivechatDepartment.findByBusinessHourId(businessHourId, {
				projection: { _id: 1 },
			}).toArray()
		).map((dept) => dept._id);
		const agentIds = (
			await LivechatDepartmentAgents.findByDepartmentIds(departmentIds, {
				projection: { agentId: 1 },
			}).toArray()
		).map((dept) => dept.agentId);
		this.UsersRepository.removeBusinessHourByAgentIds(agentIds, businessHourId);
	}

	private async removeBusinessHourFromDepartmentsIfNeeded(businessHourId: string, departmentsToRemove: string[]): Promise<void> {
		if (!departmentsToRemove.length) {
			return;
		}
		await LivechatDepartment.removeBusinessHourFromDepartmentsByIdsAndBusinessHourId(departmentsToRemove, businessHourId);
	}

	private async removeBHFromPreviouslyConnectedDepartmentAgentsIfRequired(departments: string[]): Promise<void> {
		const oldBHIds = await (
			await LivechatDepartment.findInIds(departments, {
				projection: {
					businessHourId: 1,
				},
			}).toArray()
		)
			.filter((dept) => dept?.businessHourId)
			.map((dept) => dept.businessHourId);

		await Users.closeAgentsBusinessHoursByBusinessHourIds(oldBHIds);
		await Users.updateLivechatStatusBasedOnBusinessHours();
	}

	private async addBusinessHourToDepartmentsIfNeeded(businessHourId: string, departmentsToAdd: string[]): Promise<void> {
		if (!departmentsToAdd.length) {
			return;
		}
		await LivechatDepartment.addBusinessHourToDepartmentsByIds(departmentsToAdd, businessHourId);
	}
}

businessHourManager.registerBusinessHourType(new CustomBusinessHour());
