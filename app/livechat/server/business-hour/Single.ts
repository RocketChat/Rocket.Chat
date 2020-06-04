import { IBusinessHour } from './BusinessHourManager';
import { ILivechatBusinessHourRepository } from '../../../models/server/raw/LivechatBusinessHours';
import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';

export class SingleBusinessHour implements IBusinessHour {
	private LivechatBusinessHourRepository: ILivechatBusinessHourRepository;

	constructor(LivechatBusinessHourRepository: ILivechatBusinessHourRepository) {
		this.LivechatBusinessHourRepository = LivechatBusinessHourRepository;
	}

	saveBusinessHour(businessHourData: ILivechatBusinessHour): void {
		if (!businessHourData._id) {
			return;
		}
		this.LivechatBusinessHourRepository.updateOne(businessHourData._id, businessHourData);
	}

	getBusinessHour(): Promise<ILivechatBusinessHour> {
		return this.LivechatBusinessHourRepository.findOneDefaultBusinessHour();
	}
}
