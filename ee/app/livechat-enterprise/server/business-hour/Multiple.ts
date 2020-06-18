import {
	AbstractBusinessHour,
	IBusinessHour,
} from '../../../../../app/livechat/server/business-hour/AbstractBusinessHour';
import { ILivechatBusinessHour } from '../../../../../definition/ILivechatBusinessHour';

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

	saveBusinessHour(/* businessHourData: ILivechatBusinessHour*/): Promise<void> {
		return Promise.resolve();
	}
}
