import moment from 'moment';

import {
	AbstractBusinessHour,
	IBusinessHour,
} from '../../../../../app/livechat/server/business-hour/AbstractBusinessHour';
import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../../definition/ILivechatBusinessHour';

interface IBusinessHoursExtraProperties extends ILivechatBusinessHour {
	timezoneName: string;
}

export class MultipleBusinessHours extends AbstractBusinessHour implements IBusinessHour {
	closeBusinessHoursByDayAndHour(/* day: string, hour: string, utc: string*/): Promise<void> {
		return Promise.resolve(undefined);
	}

	getBusinessHour(id: string): Promise<ILivechatBusinessHour> {
		return this.BusinessHourRepository.findOneById(id);
	}

	openBusinessHoursByDayHourAndUTC(/* day: string, hour: string, utc: string*/): Promise<void> {
		return Promise.resolve(undefined);
	}

	saveBusinessHour(businessHourData: IBusinessHoursExtraProperties): Promise<void> {
		businessHourData.timezone = {
			name: businessHourData.timezoneName,
			utc: this.getUTCFromTimezone(businessHourData.timezoneName),
		};
		businessHourData.active = Boolean(businessHourData.active);
		businessHourData.type = businessHourData.type || LivechatBussinessHourTypes.MULTIPLE;
		delete businessHourData.timezoneName;
		if (businessHourData._id) {
			return this.BusinessHourRepository.updateOne(businessHourData._id, businessHourData);
		}
		return this.BusinessHourRepository.insertOne(businessHourData);
	}

	private getUTCFromTimezone(timezone: string): string {
		if (!timezone) {
			return String(moment().utcOffset() / 60);
		}
		return moment.tz(timezone).format('Z');
	}
}
