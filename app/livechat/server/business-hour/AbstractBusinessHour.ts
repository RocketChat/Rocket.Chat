import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';
import {
	ILivechatBusinessHourRepository,
	IWorkHoursForCreateCronJobs,
} from '../../../models/server/raw/LivechatBusinessHours';

export interface IBusinessHour {
	saveBusinessHour(businessHourData: ILivechatBusinessHour): void;
	getBusinessHour(id: string): Promise<ILivechatBusinessHour>;
	findHoursToCreateJobs(): Promise<IWorkHoursForCreateCronJobs[]>;
}

export abstract class AbstractBusinessHour {
	protected LivechatBusinessHourRepository: ILivechatBusinessHourRepository;

	constructor(LivechatBusinessHourRepository: ILivechatBusinessHourRepository) {
		this.LivechatBusinessHourRepository = LivechatBusinessHourRepository;
	}

	async findHoursToCreateJobs(): Promise<IWorkHoursForCreateCronJobs[]> {
		return this.LivechatBusinessHourRepository.findHoursToScheduleJobs();
	}
}
