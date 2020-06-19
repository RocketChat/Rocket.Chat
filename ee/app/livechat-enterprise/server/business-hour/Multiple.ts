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

	closeBusinessHoursByDayAndHour(/* day: string, hour: string, utc: string*/): Promise<void> {
		return Promise.resolve(undefined);
	}

	async getBusinessHour(id: string): Promise<ILivechatBusinessHour | undefined> {
		if (!id) {
			return;
		}
		const businessHour: ILivechatBusinessHour = await this.BusinessHourRepository.findOneById(id);
		businessHour.departments = await this.DepartmentsRepository.findByBusinessHourId(businessHour._id, { fields: { name: 1 } }).toArray();
		return businessHour;
	}

	openBusinessHoursByDayHourAndUTC(/* day: string, hour: string, utc: string*/): Promise<void> {
		return Promise.resolve(undefined);
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
		return this.BusinessHourRepository.insertOne(businessHourData);
	}

	async removeBusinessHourById(id: string): Promise<void> {
		const businessHour = await this.BusinessHourRepository.findOneById(id);
		if (!businessHour || businessHour.type !== LivechatBussinessHourTypes.MULTIPLE) {
			return;
		}
		this.BusinessHourRepository.removeById(id);
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
		const businessHoursToOpenIds = await this.getBusinessHoursThatMustBeOpen(day, currentTime, activeBusinessHours);
		for (const businessHour of businessHoursToOpenIds) {
			this.openBusinessHour(businessHour);
		}
	}

	private async openBusinessHour(businessHour: Record<string, any>): Promise<void> {
		if (businessHour.type !== LivechatBussinessHourTypes.SINGLE) {
			const departmentIds = (await this.DepartmentsRepository.findByBusinessHourId(businessHour._id, { fields: { _id: 1 } }).toArray()).map((dept: any) => dept._id);
			const agentIds = (await this.DepartmentsAgentsRepository.findByDepartmentIds(departmentIds, { fields: { agentId: 1 } }).toArray()).map((dept: any) => dept.agentId);
			return this.UsersRepository.openBusinessHourByAgentIds(agentIds, businessHour._id);
		}
		const agentIdsWithDepartment = (await this.DepartmentsAgentsRepository.find({}, { fields: { agentId: 1 } }).toArray()).map((dept: any) => dept.agentId);
		return this.UsersRepository.openBusinessHourToAgentsWithoutDepartment(agentIdsWithDepartment, businessHour._id);
	}

	private getUTCFromTimezone(timezone: string): string {
		if (!timezone) {
			return String(moment().utcOffset() / 60);
		}
		return moment.tz(timezone).format('Z');
	}
}
