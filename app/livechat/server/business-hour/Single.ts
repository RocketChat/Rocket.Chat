import moment from 'moment';

import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../definition/ILivechatBusinessHour';
import { AbstractBusinessHour, IBusinessHour } from './AbstractBusinessHour';

export class SingleBusinessHour extends AbstractBusinessHour implements IBusinessHour {
	async saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void> {
		if (!businessHourData._id) {
			return;
		}
		businessHourData.timezone = {
			name: '',
			utc: moment().utcOffset() / 60,
		};
		this.BusinessHourRepository.updateOne(businessHourData._id, businessHourData);
	}

	getBusinessHour(): Promise<ILivechatBusinessHour> {
		return this.BusinessHourRepository.findOneDefaultBusinessHour();
	}

	async openBusinessHoursByDayHourAndUTC(day: string, hour: string, utc: string): Promise<void> {
		const businessHoursIds = await this.BusinessHourRepository.findActiveBusinessHoursIdsToOpen(LivechatBussinessHourTypes.SINGLE, day, hour, utc);
		this.UsersRepository.openAgentsBusinessHours(businessHoursIds);
	}

	async closeBusinessHoursByDayAndHour(day: string, hour: string, utc: string): Promise<void> {
		const businessHoursIds = await this.BusinessHourRepository.findActiveBusinessHoursIdsToClose(LivechatBussinessHourTypes.SINGLE, day, hour, utc);
		await this.UsersRepository.closeAgentsBusinessHours(businessHoursIds);
		this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
	}
}
