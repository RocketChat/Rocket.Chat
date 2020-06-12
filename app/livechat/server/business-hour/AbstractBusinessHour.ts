import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../definition/ILivechatBusinessHour';
import {
	ILivechatBusinessHourRepository,
	IWorkHoursForCreateCronJobs,
} from '../../../models/server/raw/LivechatBusinessHours';
import { UsersRaw } from '../../../models/server/raw/Users';
import { Users } from '../../../models/server/raw';

export interface IBusinessHour {
	saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void>;
	allowAgentChangeServiceStatus(agentId: string): Promise<boolean>;
	getBusinessHour(id: string): Promise<ILivechatBusinessHour>;
	findHoursToCreateJobs(): Promise<IWorkHoursForCreateCronJobs[]>;
	openBusinessHoursByDayAndHour(day: string, hour: string): Promise<void>;
	closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void>;
}

export abstract class AbstractBusinessHour {
	protected LivechatBusinessHourRepository: ILivechatBusinessHourRepository;

	protected UsersRepository: UsersRaw = Users;

	constructor(LivechatBusinessHourRepository: ILivechatBusinessHourRepository) {
		this.LivechatBusinessHourRepository = LivechatBusinessHourRepository;
	}

	async findHoursToCreateJobs(): Promise<IWorkHoursForCreateCronJobs[]> {
		return this.LivechatBusinessHourRepository.findHoursToScheduleJobs();
	}

	async closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void> {
		const businessHoursIds = await this.LivechatBusinessHourRepository.findActiveBusinessHoursIdsToClose(LivechatBussinessHourTypes.SINGLE, day, hour);
		await this.UsersRepository.closeAgentsBusinessHours(businessHoursIds);
		this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
	}

	async allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
		return this.UsersRepository.isAgentWithinBusinessHours(agentId);
	}
}
