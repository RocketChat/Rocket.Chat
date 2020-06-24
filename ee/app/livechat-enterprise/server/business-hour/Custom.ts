import moment from 'moment';

import {
	AbstractBusinessHourType,
	IBusinessHourType,
} from '../../../../../app/livechat/server/business-hour/AbstractBusinessHour';
import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../../definition/ILivechatBusinessHour';
import { LivechatDepartmentRaw } from '../../../../../app/models/server/raw/LivechatDepartment';
import { LivechatDepartment } from '../../../../../app/models/server/raw';
import { BusinessHourManager } from '../../../../../app/livechat/server/business-hour/BusinessHourManager';
import { callbacks } from '../../../../../app/callbacks/server';
import { businessHourManager } from '../../../../../app/livechat/server/business-hour';

interface IBusinessHoursExtraProperties extends ILivechatBusinessHour {
	timezoneName: string;
	departmentsToApplyBusinessHour: string;
}

class CustomBusinessHour extends AbstractBusinessHourType implements IBusinessHourType {
	name = LivechatBussinessHourTypes.CUSTOM;

	private DepartmentsRepository: LivechatDepartmentRaw = LivechatDepartment;

	async getBusinessHour(id: string): Promise<ILivechatBusinessHour | undefined> {
		if (!id) {
			return;
		}
		const businessHour: ILivechatBusinessHour = await this.BusinessHourRepository.findOneById(id);
		businessHour.departments = await this.DepartmentsRepository.findByBusinessHourId(businessHour._id, { fields: { name: 1 } }).toArray();
		return businessHour;
	}

	async saveBusinessHour(businessHourData: IBusinessHoursExtraProperties): Promise<void> {
		businessHourData.timezone = {
			name: businessHourData.timezoneName,
			utc: this.getUTCFromTimezone(businessHourData.timezoneName),
		};
		const departments = businessHourData.departmentsToApplyBusinessHour?.split(',').filter(Boolean);
		delete businessHourData.timezoneName;
		delete businessHourData.departmentsToApplyBusinessHour;
		delete businessHourData.departments;
		const businessHourId = await this.baseSaveBusinessHour(businessHourData);
		const currentDepartments = (await this.DepartmentsRepository.findByBusinessHourId(businessHourId, { fields: { _id: 1 } }).toArray()).map((dept: any) => dept._id);
		await this.removeBusinessHourFromDepartmentsIfNeeded(businessHourId, currentDepartments, departments);
		await this.addBusinessHourToDepartmentsIfNeeded(businessHourId, currentDepartments, departments);
	}

	private async removeBusinessHourFromDepartmentsIfNeeded(businessHourId: string, currentDepartments: string[], departments: string[]): Promise<void> {
		const toRemove = [...currentDepartments.filter((dept: string) => !departments.includes(dept))];
		if (!toRemove.length) {
			return;
		}
		await this.DepartmentsRepository.removeBusinessHourFromDepartmentsIdsByBusinessHourId(toRemove, businessHourId);
	}

	private async addBusinessHourToDepartmentsIfNeeded(businessHourId: string, currentDepartments: string[], departments: string[]): Promise<void> {
		const toAdd = [...departments.filter((dept: string) => !currentDepartments.includes(dept))];
		if (!toAdd.length) {
			return;
		}
		await this.DepartmentsRepository.addBusinessHourToDepartamentsByIds(toAdd, businessHourId);
	}

	private getUTCFromTimezone(timezone: string): string {
		if (!timezone) {
			return String(moment().utcOffset() / 60);
		}
		return moment.tz(timezone).format('Z');
	}
}

businessHourManager.registerBusinessHourType(new CustomBusinessHour());
