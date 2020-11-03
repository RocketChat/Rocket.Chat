import {
	getDateWithUTC,
	getTimeZoneDate,
	getDateWithFormat,
	cloneDate,
	utcOffsetDate,
	getDate,
	addDate,
} from '../../../../lib/rocketchat-dates';
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
	getBusinessHour(id: string): Promise<ILivechatBusinessHour | undefined>;
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
			await this.BusinessHourRepository.updateOne(businessHourData._id, businessHourData);
			return businessHourData._id;
		}
		const { insertedId } = await this.BusinessHourRepository.insertOne(businessHourData);
		return insertedId;
	}

	private convertWorkHours(businessHourData: ILivechatBusinessHour): ILivechatBusinessHour {
		businessHourData.workHours.forEach((hour: any) => {
			const startUtc = getDateWithUTC(getTimeZoneDate(`${ hour.day }:${ hour.start }`, 'dddd:HH:mm', businessHourData.timezone.name));
			const finishUtc = getDateWithUTC(getTimeZoneDate(`${ hour.day }:${ hour.finish }`, 'dddd:HH:mm', businessHourData.timezone.name));
			hour.start = {
				time: hour.start,
				utc: {
					dayOfWeek: getDateWithFormat(cloneDate(startUtc), 'dddd'),
					time: getDateWithFormat(cloneDate(startUtc), 'HH:mm'),
				},
				cron: {
					dayOfWeek: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(startUtc, 'dddd'),
					time: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(startUtc, 'HH:mm'),
				},
			};
			hour.finish = {
				time: hour.finish,
				utc: {
					dayOfWeek: getDateWithFormat(cloneDate(finishUtc), 'dddd'),
					time: getDateWithFormat(cloneDate(finishUtc), 'HH:mm'),
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
			return String(utcOffsetDate(getDate()) / 60);
		}
		return getDateWithFormat(getTimeZoneDate(timezone), 'Z');
	}

	private formatDayOfTheWeekFromServerTimezoneAndUtcHour(utc: any, format: string): string {
		return getDateWithFormat(addDate(getDate(getDateWithFormat(utc, 'dddd:HH:mm'), 'dddd:HH:mm'), utcOffsetDate(getDate()) / 60, 'hours'), format);
	}
}
