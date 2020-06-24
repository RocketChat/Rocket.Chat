import moment from 'moment';

import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';
import {
	IWorkHoursForCreateCronJobs, LivechatBusinessHoursRaw,
} from '../../../models/server/raw/LivechatBusinessHours';
import { UsersRaw } from '../../../models/server/raw/Users';
import { LivechatBusinessHours, Users } from '../../../models/server/raw';

export interface IBusinessHourBehavior {
	findHoursToCreateJobs(): Promise<IWorkHoursForCreateCronJobs[]>;
	openBusinessHoursByDayHour(day: string, hour: string): Promise<void>;
	closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void>;
	onDisableBusinessHours(): Promise<void>;
	// onSaveBusinessHour(businessHour: ILivechatBusinessHour): Promise<void>;
	// saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void>;
	// allowAgentChangeServiceStatus(agentId: string): Promise<boolean>;
	// findHoursToCreateJobs(): Promise<IWorkHoursForCreateCronJobs[]>;
	// removeBusinessHourById(id: string): Promise<void>;
	// removeBusinessHourFromUsers(departmentId: string, businessHourId: string): Promise<void>;
	// openBusinessHoursIfNeeded(): Promise<void>;
	// removeBuinessHourFromUsersByIds(userIds: string[], businessHourId: string): Promise<void>;
	// addBusinessHourToUsersByIds(userIds: string[], businessHourId: string): Promise<void>;
	// setDefaultToUsersIfNeeded(userIds: string[]): Promise<void>;
}

// export interface IBusinessHour {
// 	saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void>;
// 	allowAgentChangeServiceStatus(agentId: string): Promise<boolean>;
// 	getBusinessHour(id: string): Promise<ILivechatBusinessHour | undefined>;
// 	findHoursToCreateJobs(): Promise<IWorkHoursForCreateCronJobs[]>;
// 	openBusinessHoursByDayHour(day: string, hour: string): Promise<void>;
// 	closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void>;
// 	removeBusinessHoursFromUsers(): Promise<void>;
// 	removeBusinessHourById(id: string): Promise<void>;
// 	removeBusinessHourFromUsers(departmentId: string, businessHourId: string): Promise<void>;
// 	openBusinessHoursIfNeeded(): Promise<void>;
// 	removeBuinessHourFromUsersByIds(userIds: string[], businessHourId: string): Promise<void>;
// 	addBusinessHourToUsersByIds(userIds: string[], businessHourId: string): Promise<void>;
// 	setDefaultToUsersIfNeeded(userIds: string[]): Promise<void>;
// }

export interface IBusinessHourType {
	name: string;
	getBusinessHour(id: string): Promise<ILivechatBusinessHour | undefined>;
	saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void>;
}

export abstract class AbstractBusinessHourBehavior {
	protected BusinessHourRepository: LivechatBusinessHoursRaw = LivechatBusinessHours;

	protected UsersRepository: UsersRaw = Users;

	async findHoursToCreateJobs(): Promise<IWorkHoursForCreateCronJobs[]> {
		return this.BusinessHourRepository.findHoursToScheduleJobs();
	}

	async onDisableBusinessHours(): Promise<void> {
		await this.UsersRepository.removeBusinessHoursFromAllUsers();
		return this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
	}
}

export abstract class AbstractBusinessHourType {
	protected BusinessHourRepository: LivechatBusinessHoursRaw = LivechatBusinessHours;

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

	private formatDayOfTheWeekFromServerTimezoneAndUtcHour(utc: any, format: string): string {
		return moment(utc.format('dddd:HH:mm'), 'dddd:HH:mm').add(moment().utcOffset() / 60, 'hours').format(format);
	}
}

// import moment from 'moment';
//
// import { ILivechatBusinessHour } from '../../../../definition/ILivechatBusinessHour';
// import {
// 	IWorkHoursForCreateCronJobs, LivechatBusinessHoursRaw,
// } from '../../../models/server/raw/LivechatBusinessHours';
// import { UsersRaw } from '../../../models/server/raw/Users';
// import { LivechatBusinessHours, Users } from '../../../models/server/raw';
//
// export interface IBusinessHour {
// 	saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<void>;
// 	allowAgentChangeServiceStatus(agentId: string): Promise<boolean>;
// 	getBusinessHour(id: string): Promise<ILivechatBusinessHour | undefined>;
// 	findHoursToCreateJobs(): Promise<IWorkHoursForCreateCronJobs[]>;
// 	openBusinessHoursByDayHour(day: string, hour: string): Promise<void>;
// 	closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void>;
// 	removeBusinessHoursFromUsers(): Promise<void>;
// 	removeBusinessHourById(id: string): Promise<void>;
// 	removeBusinessHourFromUsers(departmentId: string, businessHourId: string): Promise<void>;
// 	openBusinessHoursIfNeeded(): Promise<void>;
// 	removeBusinessHourFromUsersByIds(userIds: string[], businessHourId: string): Promise<void>;
// 	addBusinessHourToUsersByIds(userIds: string[], businessHourId: string): Promise<void>;
// 	setDefaultToUsersIfNeeded(userIds: string[]): Promise<void>;
// }
//
// export abstract class AbstractBusinessHour {
// 	protected BusinessHourRepository: LivechatBusinessHoursRaw = LivechatBusinessHours;
//
// 	protected UsersRepository: UsersRaw = Users;
//
// 	async findHoursToCreateJobs(): Promise<IWorkHoursForCreateCronJobs[]> {
// 		return this.BusinessHourRepository.findHoursToScheduleJobs();
// 	}
//
// 	async allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
// 		return this.UsersRepository.isAgentWithinBusinessHours(agentId);
// 	}
//
// 	async removeBusinessHoursFromUsers(): Promise<void> {
// 		await this.UsersRepository.removeBusinessHoursFromUsers();
// 		await this.UsersRepository.updateLivechatStatusBasedOnBusinessHours();
// 	}
//
// 	protected async getBusinessHoursThatMustBeOpened(currentTime: any, activeBusinessHours: ILivechatBusinessHour[]): Promise<Record<string, any>[]> {
// 		return activeBusinessHours
// 			.filter((businessHour) => businessHour.workHours
// 				.filter((hour) => hour.open)
// 				.some((hour) => {
// 					const localTimeStart = moment(`${ hour.start.cron.dayOfWeek }:${ hour.start.cron.time }`, 'dddd:HH:mm');
// 					const localTimeFinish = moment(`${ hour.finish.cron.dayOfWeek }:${ hour.finish.cron.time }`, 'dddd:HH:mm');
// 					return currentTime.isSameOrAfter(localTimeStart) && currentTime.isSameOrBefore(localTimeFinish);
// 				}))
// 			.map((businessHour) => ({
// 				_id: businessHour._id,
// 				type: businessHour.type,
// 			}));
// 	}
//
// 	protected convertWorkHoursWithServerTimezone(businessHourData: ILivechatBusinessHour): ILivechatBusinessHour {
// 		businessHourData.workHours.forEach((hour: any) => {
// 			hour.start = {
// 				time: hour.start,
// 				utc: {
// 					dayOfWeek: this.formatDayOfTheWeekFromUTC(`${ hour.day }:${ hour.start }`, 'dddd'),
// 					time: this.formatDayOfTheWeekFromUTC(`${ hour.day }:${ hour.start }`, 'HH:mm'),
// 				},
// 				cron: {
// 					dayOfWeek: this.formatDayOfTheWeekFromServerTimezone(`${ hour.day }:${ hour.start }`, 'dddd'),
// 					time: this.formatDayOfTheWeekFromServerTimezone(`${ hour.day }:${ hour.start }`, ' HH:mm'),
// 				},
// 			};
// 			hour.finish = {
// 				time: hour.finish,
// 				utc: {
// 					dayOfWeek: this.formatDayOfTheWeekFromUTC(`${ hour.day }:${ hour.finish }`, 'dddd'),
// 					time: this.formatDayOfTheWeekFromUTC(`${ hour.day }:${ hour.finish }`, 'HH:mm'),
// 				},
// 				cron: {
// 					dayOfWeek: this.formatDayOfTheWeekFromServerTimezone(`${ hour.day }:${ hour.finish }`, 'dddd'),
// 					time: this.formatDayOfTheWeekFromServerTimezone(`${ hour.day }:${ hour.finish }`, 'HH:mm'),
// 				},
// 			};
// 		});
// 		return businessHourData;
// 	}
//
// 	protected formatDayOfTheWeekFromServerTimezone(hour: string, format: string): string {
// 		return moment(hour, 'dddd:HH:mm').format(format);
// 	}
//
// 	protected formatDayOfTheWeekFromUTC(hour: string, format: string): string {
// 		return moment(hour, 'dddd:HH:mm').utc().format(format);
// 	}
// }
