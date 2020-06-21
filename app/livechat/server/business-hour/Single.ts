import moment from 'moment';

import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../definition/ILivechatBusinessHour';
import { AbstractBusinessHour, IBusinessHour } from './AbstractBusinessHour';

export class SingleBusinessHour extends AbstractBusinessHour implements IBusinessHour {
	async saveBusinessHour(businessHourData: any): Promise<void> {
		if (!businessHourData._id) {
			return;
		}
		businessHourData = this.convertWorkHoursWithServerTimezone(businessHourData);
		businessHourData.timezone = {
			name: '',
			utc: String(moment().utcOffset() / 60),
		};
		await this.BusinessHourRepository.updateOne(businessHourData._id, businessHourData);
	}

	getBusinessHour(): Promise<ILivechatBusinessHour> {
		return this.BusinessHourRepository.findOneDefaultBusinessHour();
	}

	async openBusinessHoursByDayHour(day: string, hour: string): Promise<void> {
		const businessHoursIds = (await this.BusinessHourRepository.findActiveBusinessHoursToOpen(day, hour, LivechatBussinessHourTypes.SINGLE, { fields: { _id: 1 } })).map((businessHour) => businessHour._id);
		this.UsersRepository.openAgentsBusinessHours(businessHoursIds);
	}

	async closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHoursIds = (await this.BusinessHourRepository.findActiveBusinessHoursToClose(day, hour, LivechatBussinessHourTypes.SINGLE, { fields: { _id: 1 } })).map((businessHour) => businessHour._id);
		await this.UsersRepository.closeAgentsBusinessHours(businessHoursIds);
		this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
	}

	async openBusinessHoursIfNeeded(): Promise<void> {
		await this.removeBusinessHoursFromUsers();
		const currentTime = moment(moment().format('dddd:HH:mm'), 'dddd:HH:mm');
		const day = currentTime.format('dddd');
		const activeBusinessHours = await this.BusinessHourRepository.findDefaultActiveAndOpenBusinessHoursByDay(day, {
			fields: {
				workHours: 1,
				timezone: 1,
				type: 1,
			},
		});
		const businessHoursToOpenIds = (await this.getBusinessHoursThatMustBeOpened(day, currentTime, activeBusinessHours)).map((businessHour) => businessHour._id);
		await this.UsersRepository.openAgentsBusinessHours(businessHoursToOpenIds);
		await this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
	}

	removeBusinessHourFromUsers(): Promise<void> {
		return Promise.resolve();
	}

	removeBusinessHourById(): Promise<void> {
		return Promise.resolve();
	}

	removeBusinessHourFromUsersByIds(): Promise<void> {
		return Promise.resolve();
	}

	addBusinessHourToUsersByIds(): Promise<void> {
		return Promise.resolve();
	}
}
