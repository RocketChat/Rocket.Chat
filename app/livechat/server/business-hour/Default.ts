import moment from 'moment';

import { AbstractBusinessHourType, IBusinessHourType } from './AbstractBusinessHour';
import { callbacks } from '../../../callbacks/server';
import { BusinessHourManager } from './BusinessHourManager';
import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../definition/ILivechatBusinessHour';

import { businessHourManager } from './index';

export class DefaultBusinessHour extends AbstractBusinessHourType implements IBusinessHourType {
	name = LivechatBussinessHourTypes.DEFAULT;

	getBusinessHour(): Promise<ILivechatBusinessHour | undefined> {
		return this.BusinessHourRepository.findOneDefaultBusinessHour();
	}

	async saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void> {
		if (!businessHourData._id) {
			return;
		}
		businessHourData.timezone = {
			name: moment.tz.guess(),
			utc: String(moment().utcOffset() / 60),
		};
		await this.baseSaveBusinessHour(businessHourData);
	}
}
