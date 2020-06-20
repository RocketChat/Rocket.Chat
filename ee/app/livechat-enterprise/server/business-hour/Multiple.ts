import moment from 'moment';

import {
	AbstractBusinessHour,
	IBusinessHour,
} from '../../../../../app/livechat/server/business-hour/AbstractBusinessHour';
import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../../definition/ILivechatBusinessHour';
import { LivechatDepartment, LivechatDepartmentAgents } from '../../../../../app/models/server/raw';
import { LivechatDepartmentRaw } from '../../../../../app/models/server/raw/LivechatDepartment';
import { LivechatDepartmentAgentsRaw } from '../../../../../app/models/server/raw/LivechatDepartmentAgents';

interface IBusinessHoursExtraProperties extends ILivechatBusinessHour {
	timezoneName: string;
	departmentsToApplyBusinessHour: string;
}

export class MultipleBusinessHours extends AbstractBusinessHour implements IBusinessHour {
	private DepartmentsRepository: LivechatDepartmentRaw = LivechatDepartment;

	private DepartmentsAgentsRepository: LivechatDepartmentAgentsRaw = LivechatDepartmentAgents;

	async closeBusinessHoursByDayAndHour(day: string, hour: string, utc: string): Promise<void> {
		const businessHours = await this.BusinessHourRepository.findActiveBusinessHoursToClose(day, hour, utc, undefined, {
			fields: {
				_id: 1,
				type: 1,
			},
		});
		for (const businessHour of businessHours) {
			this.closeBusinessHour(businessHour);
		}
	}

	async getBusinessHour(id: string): Promise<ILivechatBusinessHour | undefined> {
		if (!id) {
			return;
		}
		const businessHour: ILivechatBusinessHour = await this.BusinessHourRepository.findOneById(id);
		businessHour.departments = await this.DepartmentsRepository.findByBusinessHourId(businessHour._id, { fields: { name: 1 } }).toArray();
		return businessHour;
	}

	async openBusinessHoursByDayHourAndUTC(day: string, hour: string, utc: string): Promise<void> {
		const businessHours = await this.BusinessHourRepository.findActiveBusinessHoursToOpen(day, hour, utc, undefined, {
			fields: {
				_id: 1,
				type: 1,
			},
		});
		for (const businessHour of businessHours) {
			this.openBusinessHour(businessHour);
		}
	}

	async saveBusinessHour(businessHourData: IBusinessHoursExtraProperties): Promise<void> {
		businessHourData.timezone = {
			name: businessHourData.timezoneName,
			utc: this.getUTCFromTimezone(businessHourData.timezoneName),
		};
		businessHourData.workHours.forEach((hour) => {
			if (businessHourData.timezone.name) {
				hour.start = moment.tz(hour.start, 'HH:mm', businessHourData.timezone.name).utc().format('HH:mm');
				hour.finish = moment.tz(hour.finish, 'HH:mm', businessHourData.timezone.name).utc().format('HH:mm');
			} else {
				hour.start = moment(hour.start, 'HH:mm').utc().format('HH:mm');
				hour.finish = moment(hour.finish, 'HH:mm').utc().format('HH:mm');
			}
		});
		businessHourData.active = Boolean(businessHourData.active);
		businessHourData.type = businessHourData.type || LivechatBussinessHourTypes.MULTIPLE;
		const departments = businessHourData.departmentsToApplyBusinessHour?.split(',');
		delete businessHourData.timezoneName;
		delete businessHourData.departmentsToApplyBusinessHour;
		delete businessHourData.departments;
		if (businessHourData._id) {
			await this.BusinessHourRepository.updateOne(businessHourData._id, businessHourData);
			if (!departments?.length) {
				return;
			}
			await this.DepartmentsRepository.removeBusinessHourFromDepartmentsByBusinessHourId(businessHourData._id);
			return this.DepartmentsRepository.addBusinessHourToDepartamentsByIds(departments, businessHourData._id);
		}
		const { insertedId } = await this.BusinessHourRepository.insertOne(businessHourData);
		if (!departments?.length) {
			return;
		}
		return this.DepartmentsRepository.addBusinessHourToDepartamentsByIds(departments, insertedId);
	}

	async removeBusinessHourById(id: string): Promise<void> {
		const businessHour = await this.BusinessHourRepository.findOneById(id);
		if (!businessHour || businessHour.type !== LivechatBussinessHourTypes.MULTIPLE) {
			return;
		}
		this.BusinessHourRepository.removeById(id);
		this.DepartmentsRepository.removeBusinessHourFromDepartmentsByBusinessHourId(id);
	}

	async openBusinessHoursIfNeeded(): Promise<void> {
		await this.removeBusinessHoursFromUsers();
		const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm');
		const day = currentTime.format('dddd');
		const activeBusinessHours = await this.BusinessHourRepository.findActiveAndOpenBusinessHoursByDay(day, {
			fields: {
				workHours: 1,
				timezone: 1,
				type: 1,
			},
		});
		const businessHoursToOpenIds = await this.getBusinessHoursThatMustBeOpened(day, currentTime, activeBusinessHours);
		for (const businessHour of businessHoursToOpenIds) {
			this.openBusinessHour(businessHour);
		}
	}

	async removeBusinessHourFromUsers(departmentId: string): Promise<void> {
		const agentIds = (await this.DepartmentsAgentsRepository.findByDepartmentIds([departmentId], { fields: { agentId: 1 } }).toArray()).map((dept: any) => dept.agentId);
		return this.UsersRepository.closeBusinessHourByAgentIds(agentIds);
	}

	private async openBusinessHour(businessHour: Record<string, any>): Promise<void> {
		if (businessHour.type === LivechatBussinessHourTypes.MULTIPLE) {
			const agentIds = await this.getAgentIdsFromBusinessHour(businessHour);
			return this.UsersRepository.openBusinessHourByAgentIds(agentIds, businessHour._id);
		}
		const agentIdsWithDepartment = await this.getAgentIdsWithDepartment();
		return this.UsersRepository.openBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment, businessHour._id);
	}

	private async getAgentIdsFromBusinessHour(businessHour: Record<string, any>): Promise<string[]> {
		const departmentIds = (await this.DepartmentsRepository.findByBusinessHourId(businessHour._id, { fields: { _id: 1 } }).toArray()).map((dept: any) => dept._id);
		const agentIds = (await this.DepartmentsAgentsRepository.findByDepartmentIds(departmentIds, { fields: { agentId: 1 } }).toArray()).map((dept: any) => dept.agentId);
		return agentIds;
	}

	private async getAgentIdsWithDepartment(): Promise<string[]> {
		const agentIdsWithDepartment = (await this.DepartmentsAgentsRepository.find({}, { fields: { agentId: 1 } }).toArray()).map((dept: any) => dept.agentId);
		return agentIdsWithDepartment;
	}

	private async closeBusinessHour(businessHour: Record<string, any>): Promise<void> {
		if (businessHour.type === LivechatBussinessHourTypes.MULTIPLE) {
			const agentIds = await this.getAgentIdsFromBusinessHour(businessHour);
			await this.UsersRepository.closeBusinessHourByAgentIds(agentIds, businessHour._id);
			return this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
		}
		const agentIdsWithDepartment = await this.getAgentIdsWithDepartment();
		await this.UsersRepository.closeBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment, businessHour._id);
		return this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
	}

	private getUTCFromTimezone(timezone: string): string {
		if (!timezone) {
			return String(moment().utcOffset() / 60);
		}
		return moment.tz(timezone).format('Z');
	}
}
