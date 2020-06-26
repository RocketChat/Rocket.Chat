import moment from 'moment';

import { AbstractBusinessHourType, IBusinessHourType } from './AbstractBusinessHour';
import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../definition/ILivechatBusinessHour';

export class DefaultBusinessHour extends AbstractBusinessHourType implements IBusinessHourType {
	name = LivechatBussinessHourTypes.DEFAULT;

	getBusinessHour(): Promise<ILivechatBusinessHour | undefined> {
		return this.BusinessHourRepository.findOneDefaultBusinessHour();
	}

	async saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<ILivechatBusinessHour> {
		if (!businessHourData._id) {
			return businessHourData;
		}
		businessHourData.timezone = {
			name: moment.tz.guess(),
			utc: String(moment().utcOffset() / 60),
		};
		await this.baseSaveBusinessHour(businessHourData);
		return businessHourData;
	}

	removeBusinessHourById(): Promise<void> {
		return Promise.resolve();
	}
}
