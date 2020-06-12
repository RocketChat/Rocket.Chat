import moment from 'moment';

import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../definition/ILivechatBusinessHour';
import { AbstractBusinessHour, IBusinessHour } from './AbstractBusinessHour';

export class SingleBusinessHour extends AbstractBusinessHour implements IBusinessHour {
	async saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void> {
		businessHourData.timezone = {
			name: '',
			utc: moment().utcOffset() / 60,
		};
		if (!businessHourData._id) {
			return;
		}
		this.LivechatBusinessHourRepository.updateOne(businessHourData._id, businessHourData);
	}

	getBusinessHour(): Promise<ILivechatBusinessHour> {
		return this.LivechatBusinessHourRepository.findOneDefaultBusinessHour();
	}

	async openBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHoursIds = await this.LivechatBusinessHourRepository.findActiveBusinessHoursIdsToOpen(LivechatBussinessHourTypes.SINGLE, day, hour);
		this.UsersRepository.openAgentsBusinessHours(businessHoursIds);
	}
}
