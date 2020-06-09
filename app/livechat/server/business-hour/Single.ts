import moment from 'moment';

import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';
import { AbstractBusinessHour, IBusinessHour } from './AbstractBusinessHour';

export class SingleBusinessHour extends AbstractBusinessHour implements IBusinessHour {
	saveBusinessHour(businessHourData: ILivechatBusinessHour): void {
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
}
