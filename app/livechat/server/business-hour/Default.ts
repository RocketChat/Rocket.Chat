import { guessTimeZoneDate } from '../../../../lib/rocketchat-dates';
import { AbstractBusinessHourType, IBusinessHourType } from './AbstractBusinessHour';
import { ILivechatBusinessHour, LivechatBusinessHourTypes } from '../../../../definition/ILivechatBusinessHour';

interface IExtraProperties extends ILivechatBusinessHour {
	timezoneName?: string;
}

export class DefaultBusinessHour extends AbstractBusinessHourType implements IBusinessHourType {
	name = LivechatBusinessHourTypes.DEFAULT;

	getBusinessHour(): Promise<ILivechatBusinessHour | undefined> {
		return this.BusinessHourRepository.findOneDefaultBusinessHour();
	}

	async saveBusinessHour(businessHourData: IExtraProperties): Promise<ILivechatBusinessHour> {
		if (!businessHourData._id) {
			return businessHourData;
		}
		businessHourData.timezone = {
			name: businessHourData.timezoneName || guessTimeZoneDate(),
			utc: this.getUTCFromTimezone(businessHourData.timezoneName),
		};
		delete businessHourData.timezoneName;
		await this.baseSaveBusinessHour(businessHourData);
		return businessHourData;
	}

	removeBusinessHourById(): Promise<void> {
		return Promise.resolve();
	}
}
