import moment from 'moment';

import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';
import {
	IWorkHoursCronJobsWrapper, LivechatBusinessHoursRaw,
} from '../../../models/server/raw/LivechatBusinessHours';
import { UsersRaw } from '../../../models/server/raw/Users';
import { LivechatBusinessHours, Users } from '../../../models/server/raw';
import { ILivechatDepartment } from '../../../../definition/ILivechatDepartment';

export interface IBusinessHourBehavior {
	findHoursToCreateJobs(): Promise<IWorkHoursCronJobsWrapper[]>;
	openBusinessHoursByDayAndHour(day: string, hour: string): Promise<void>;
	closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void>;
	onDisableBusinessHours(): Promise<void>;
	onAddAgentToDepartment(options?: Record<string, any>): Promise<any>;
	onRemoveAgentFromDepartment(options?: Record<string, any>): Promise<any>;
	onRemoveDepartment(department?: ILivechatDepartment): Promise<any>;
	onStartBusinessHours(): Promise<void>;
	afterSaveBusinessHours(businessHourData: ILivechatBusinessHour): Promise<void>;
	allowAgentChangeServiceStatus(agentId: string): Promise<boolean>;
}

export interface IBusinessHourType {
	name: string;
	getBusinessHour(id?: string): Promise<ILivechatBusinessHour | null>;
	saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<ILivechatBusinessHour>;
	removeBusinessHourById(id: string): Promise<void>;
}

export abstract class AbstractBusinessHourBehavior {
	protected BusinessHourRepository: LivechatBusinessHoursRaw = LivechatBusinessHours;

	protected UsersRepository: UsersRaw = Users;

	async findHoursToCreateJobs(): Promise<IWorkHoursCronJobsWrapper[]> {
		return this.BusinessHourRepository.findHoursToScheduleJobs();
	}

	async onDisableBusinessHours(): Promise<void> {
		await this.UsersRepository.removeBusinessHoursFromAllUsers();
	}

	async allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
		return this.UsersRepository.isAgentWithinBusinessHours(agentId);
	}
}

export abstract class AbstractBusinessHourType {
	protected BusinessHourRepository: LivechatBusinessHoursRaw = LivechatBusinessHours;

	protected UsersRepository: UsersRaw = Users;

	protected async baseSaveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<string> {
		businessHourData.active = Boolean(businessHourData.active);
		businessHourData = this.convertWorkHours(businessHourData);
		if (businessHourData._id) {
			await this.BusinessHourRepository.updateOne({ _id: businessHourData._id }, { $set: businessHourData });
			return businessHourData._id;
		}
		const { insertedId } = await this.BusinessHourRepository.insertOne(businessHourData);
		return insertedId;
	}

	private convertWorkHours(businessHourData: ILivechatBusinessHour): ILivechatBusinessHour {
		businessHourData.workHours.forEach((hour: any) => {
			const startUtc = moment.tz(`${ hour.day }:${ hour.start }`, 'dddd:HH:mm', businessHourData.timezone.name).utc();
			const finishUtc = moment.tz(`${ hour.day }:${ hour.finish }`, 'dddd:HH:mm', businessHourData.timezone.name).utc();
			hour.start = {
				time: hour.start,
				utc: {
					dayOfWeek: startUtc.clone().format('dddd'),
					time: startUtc.clone().format('HH:mm'),
				},
				cron: {
					dayOfWeek: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(startUtc, 'dddd'),
					time: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(startUtc, 'HH:mm'),
				},
			};
			hour.finish = {
				time: hour.finish,
				utc: {
					dayOfWeek: finishUtc.clone().format('dddd'),
					time: finishUtc.clone().format('HH:mm'),
				},
				cron: {
					dayOfWeek: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(finishUtc, 'dddd'),
					time: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(finishUtc, 'HH:mm'),
				},
			};
		});
		return businessHourData;
	}

	protected getUTCFromTimezone(timezone?: string): string {
		if (!timezone) {
			return String(moment().utcOffset() / 60);
		}
		return moment.tz(timezone).format('Z');
	}

	private formatDayOfTheWeekFromServerTimezoneAndUtcHour(utc: any, format: string): string {
		return moment(utc.format('dddd:HH:mm'), 'dddd:HH:mm').add(moment().utcOffset() / 60, 'hours').format(format);
	}
}
