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

	async closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHours = await this.BusinessHourRepository.findActiveBusinessHoursToClose(day, hour, undefined, {
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

	async openBusinessHoursByDayHour(day: string, hour: string): Promise<void> {
		const businessHours = await this.BusinessHourRepository.findActiveBusinessHoursToOpen(day, hour, undefined, {
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
		if (businessHourData.timezone.name) {
			businessHourData = this.convertWorkHoursWithSpecificTimezone(businessHourData);
		} else {
			businessHourData = this.convertWorkHoursWithServerTimezone(businessHourData) as IBusinessHoursExtraProperties;
		}
		businessHourData.active = Boolean(businessHourData.active);
		businessHourData.type = businessHourData.type || LivechatBussinessHourTypes.MULTIPLE;
		const departments = businessHourData.departmentsToApplyBusinessHour?.split(',');
		delete businessHourData.timezoneName;
		delete businessHourData.departmentsToApplyBusinessHour;
		delete businessHourData.departments;
		if (businessHourData._id) {
			await this.BusinessHourRepository.updateOne(businessHourData._id, businessHourData);
			return this.updateDepartmentBusinessHour(businessHourData._id, departments);
		}
		const { insertedId } = await this.BusinessHourRepository.insertOne(businessHourData);
		return this.updateDepartmentBusinessHour(insertedId, departments);
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

	async removeBusinessHourFromUsers(departmentId: string, businessHourId: string): Promise<void> {
		const agentIds = (await this.DepartmentsAgentsRepository.findByDepartmentIds([departmentId], { fields: { agentId: 1 } }).toArray()).map((dept: any) => dept.agentId);
		await this.UsersRepository.closeBusinessHourByAgentIds(agentIds, businessHourId);
		return this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
	}

	async removeBusinessHourFromUsersByIds(userIds: Array<string>, businessHourId: string): Promise<void> {
		if (!userIds?.length) {
			return;
		}

		await this.UsersRepository.closeBusinessHourByAgentIds(userIds, businessHourId);
		this.UsersRepository.updateLivechatStatusBasedOnBusinessHours(userIds);
	}

	async addBusinessHourToUsersByIds(userIds: Array<string>, businessHourId: string): Promise<void> {
		if (!userIds?.length) {
			return;
		}

		await this.UsersRepository.openBusinessHourByAgentIds(userIds, businessHourId);
		this.UsersRepository.updateLivechatStatusBasedOnBusinessHours(userIds);
	}

	private async updateDepartmentBusinessHour(businessHourId: string, departments: string[]): Promise<void> {
		if (!departments?.length) {
			return;
		}
		if (businessHourId) {
			await this.DepartmentsRepository.removeBusinessHourFromDepartmentsByBusinessHourId(businessHourId);
			return this.DepartmentsRepository.addBusinessHourToDepartamentsByIds(departments, businessHourId);
		}
		return this.DepartmentsRepository.addBusinessHourToDepartamentsByIds(departments, businessHourId);
	}

	private convertWorkHoursWithSpecificTimezone(businessHourData: IBusinessHoursExtraProperties): IBusinessHoursExtraProperties {
		businessHourData.workHours.forEach((hour: any) => {
			const startUtc = moment.tz(`${ hour.day }:${ hour.start }`, 'dddd:HH:mm', businessHourData.timezoneName).utc();
			const finishUtc = moment.tz(`${ hour.day }:${ hour.finish }`, 'dddd:HH:mm', businessHourData.timezoneName).utc();
			hour.start = {
				time: hour.start,
				utc: {
					dayOfWeek: startUtc.clone().format('dddd'),
					time: startUtc.clone().format('HH:mm'),
				},
				cron: {
					dayOfWeek: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(startUtc, 'dddd'),
					time: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(finishUtc, 'HH:mm'),
				},
			};
			hour.finish = {
				time: hour.finish,
				utc: {
					dayOfWeek: finishUtc.clone().format('dddd'),
					time: finishUtc.clone().format('HH:mm'),
				},
				cron: {
					dayOfWeek: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(startUtc, 'dddd'),
					time: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(finishUtc, 'HH:mm'),
				},
			};
		});
		return businessHourData;
	}

	private formatDayOfTheWeekFromServerTimezoneAndUtcHour(utc: any, format: string): string {
		return moment(utc.format('dddd:HH:mm'), 'dddd:HH:mm').add(moment().utcOffset() / 60, 'hours').format(format);
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
