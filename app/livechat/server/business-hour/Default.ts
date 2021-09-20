import moment from 'moment';

import { AbstractBusinessHourType, IBusinessHourType } from './AbstractBusinessHour';
import { ILivechatBusinessHour, LivechatBusinessHourTypes } from '../../../../definition/ILivechatBusinessHour';

interface IExtraProperties {
	timezoneName?: string;
}

export class DefaultBusinessHour extends AbstractBusinessHourType implements IBusinessHourType {
	name = LivechatBusinessHourTypes.DEFAULT;

	getBusinessHour(): Promise<ILivechatBusinessHour | null> {
		return this.BusinessHourRepository.findOneDefaultBusinessHour();
	}

	async saveBusinessHour(businessHour: ILivechatBusinessHour & IExtraProperties): Promise<ILivechatBusinessHour> {
		const { timezoneName, ...businessHourData } = businessHour;

		if (!businessHourData._id) {
			return businessHourData;
		}
		businessHourData.timezone = {
			name: timezoneName || moment.tz.guess(),
			utc: this.getUTCFromTimezone(timezoneName),
		};
		await this.baseSaveBusinessHour(businessHourData);
		return businessHourData;
	}

	removeBusinessHourById(): Promise<void> {
		return Promise.resolve();
	}
}
