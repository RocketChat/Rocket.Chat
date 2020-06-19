import moment from 'moment';

import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../definition/ILivechatBusinessHour';
import { AbstractBusinessHour, IBusinessHour } from './AbstractBusinessHour';

export class SingleBusinessHour extends AbstractBusinessHour implements IBusinessHour {
	async saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void> {
		if (!businessHourData._id) {
			return;
		}
		businessHourData.workHours.forEach((hour) => {
			hour.start = moment(hour.start, 'HH:mm').utc().format('HH:mm');
			hour.finish = moment(hour.finish, 'HH:mm').utc().format('HH:mm');
		});
		businessHourData.timezone = {
			name: '',
			utc: String(moment().utcOffset() / 60),
		};
		this.BusinessHourRepository.updateOne(businessHourData._id, businessHourData);
	}

	getBusinessHour(): Promise<ILivechatBusinessHour> {
		return this.BusinessHourRepository.findOneDefaultBusinessHour();
	}

	async openBusinessHoursByDayHourAndUTC(day: string, hour: string, utc: string): Promise<void> {
		const businessHoursIds = (await this.BusinessHourRepository.findActiveBusinessHoursToOpen(day, hour, utc, LivechatBussinessHourTypes.SINGLE, { fields: { _id: 1 }})).map((businessHour) => businessHour._id);
		this.UsersRepository.openAgentsBusinessHours(businessHoursIds);
	}

	async closeBusinessHoursByDayAndHour(day: string, hour: string, utc: string): Promise<void> {
		const businessHoursIds = await this.BusinessHourRepository.findActiveBusinessHoursIdsToClose(LivechatBussinessHourTypes.SINGLE, day, hour, utc);
		await this.UsersRepository.closeAgentsBusinessHours(businessHoursIds);
		this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
	}

	async openBusinessHoursIfNeeded(): Promise<void> {
		await this.removeBusinessHoursFromUsers();
		const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm');
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

	removeBusinessHourById(): Promise<void> {
		return Promise.resolve();
	}
}
