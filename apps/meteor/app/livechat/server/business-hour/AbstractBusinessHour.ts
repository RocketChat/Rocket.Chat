import type { AtLeast, ILivechatAgentStatus, ILivechatBusinessHour, ILivechatDepartment } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import type { ILivechatBusinessHoursModel, IUsersModel } from '@rocket.chat/model-typings';
import { LivechatBusinessHours, Users } from '@rocket.chat/models';
import type { IWorkHoursCronJobsWrapper } from '@rocket.chat/models';
import { TZDate, tzOffset } from '@date-fns/tz';
import { format, addHours, isBefore, isSameSecond } from 'date-fns';
import type { UpdateFilter } from 'mongodb';

import { notifyOnUserChange } from '../../../lib/server/lib/notifyListener';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function parseDayTimeInZone(day: string, timeStr: string, timezone: string): Date {
	const [h = 0, m = 0] = timeStr.split(':').map(Number);
	const dayIndex = DAY_NAMES.indexOf(day);
	const refDate = 5 + dayIndex; // 2025-01-05 is Sunday
	const tzDate = new TZDate(2025, 0, refDate, h, m, 0, timezone);
	return new Date(tzDate.getTime());
}

export function formatUtcDayTime(d: Date): { ddd: string; time: string } {
	const day = DAY_NAMES[d.getUTCDay()];
	const time = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
	return { ddd: day, time };
}

export interface IBusinessHourBehavior {
	findHoursToCreateJobs(): Promise<IWorkHoursCronJobsWrapper[]>;
	openBusinessHoursByDayAndHour(day: string, hour: string): Promise<void>;
	closeBusinessHoursByDayAndHour(day: string, hour: string): Promise<void>;
	onDisableBusinessHours(): Promise<void>;
	onAddAgentToDepartment(options?: { departmentId: string; agentsId: string[] }): Promise<any>;
	onRemoveAgentFromDepartment(options?: Record<string, any>): Promise<any>;
	onRemoveDepartment(options: { department: ILivechatDepartment; agentsIds: string[] }): Promise<any>;
	onDepartmentDisabled(department?: AtLeast<ILivechatDepartment, '_id' | 'businessHourId'>): Promise<void>;
	onDepartmentArchived(department: Pick<ILivechatDepartment, '_id' | 'businessHourId'>): Promise<void>;
	onStartBusinessHours(): Promise<void>;
	afterSaveBusinessHours(businessHourData: ILivechatBusinessHour): Promise<void>;
	allowAgentChangeServiceStatus(agentId: string): Promise<boolean>;
	changeAgentActiveStatus(agentId: string, status: string): Promise<any>;
	// If a new agent is created, this callback will be called
	onNewAgentCreated(agentId: string): Promise<void>;
}

export interface IBusinessHourType {
	name: string;
	getBusinessHour(id?: string): Promise<ILivechatBusinessHour | null>;
	saveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<ILivechatBusinessHour>;
	removeBusinessHourById(id: string): Promise<void>;
}

export abstract class AbstractBusinessHourBehavior {
	protected BusinessHourRepository: ILivechatBusinessHoursModel = LivechatBusinessHours;

	protected UsersRepository: IUsersModel = Users;

	async findHoursToCreateJobs(): Promise<IWorkHoursCronJobsWrapper[]> {
		return this.BusinessHourRepository.findHoursToScheduleJobs();
	}

	async onDisableBusinessHours(): Promise<void> {
		await this.UsersRepository.removeBusinessHoursFromAllUsers();
	}

	async allowAgentChangeServiceStatus(agentId: string): Promise<boolean> {
		return this.UsersRepository.isAgentWithinBusinessHours(agentId);
	}

	async changeAgentActiveStatus(agentId: string, status: ILivechatAgentStatus): Promise<any> {
		const result = await this.UsersRepository.setLivechatStatusIf(
			agentId,
			status,
			// Why this works: statusDefault is the property set when a user manually changes their status
			// So if it's set to offline, we can be sure the user will be offline after login and we can skip the update
			{ livechatStatusSystemModified: true, statusDefault: { $ne: UserStatus.OFFLINE } },
			{ livechatStatusSystemModified: true },
		);

		if (result.modifiedCount > 0) {
			void notifyOnUserChange({
				clientAction: 'updated',
				id: agentId,
				diff: { statusLivechat: 'available', livechatStatusSystemModified: true },
			});
		}

		return result;
	}
}

export abstract class AbstractBusinessHourType {
	protected BusinessHourRepository: ILivechatBusinessHoursModel = LivechatBusinessHours;

	protected UsersRepository: IUsersModel = Users;

	protected async baseSaveBusinessHour(businessHourData: ILivechatBusinessHour): Promise<string> {
		businessHourData.active = Boolean(businessHourData.active);
		businessHourData = this.convertWorkHours(businessHourData);
		if (businessHourData._id) {
			await this.BusinessHourRepository.updateOne({ _id: businessHourData._id }, {
				$set: businessHourData,
			} as UpdateFilter<ILivechatBusinessHour>); // TODO: Remove this cast when TypeScript is updated
			return businessHourData._id;
		}
		const { insertedId } = await this.BusinessHourRepository.insertOne(businessHourData);
		return insertedId;
	}

	private convertWorkHours(businessHourData: ILivechatBusinessHour): ILivechatBusinessHour {
		const tzName = businessHourData.timezone.name;
		businessHourData.workHours.forEach((hour: any) => {
			const startUtc = parseDayTimeInZone(hour.day, hour.start, tzName);
			const finishUtc = parseDayTimeInZone(hour.day, hour.finish, tzName);

			if (hour.open && isBefore(finishUtc, startUtc)) {
				throw new Error('error-business-hour-finish-time-before-start-time');
			}

			if (hour.open && isSameSecond(startUtc, finishUtc)) {
				throw new Error('error-business-hour-finish-time-equals-start-time');
			}

			const startFmt = formatUtcDayTime(startUtc);
			const finishFmt = formatUtcDayTime(finishUtc);
			hour.start = {
				time: hour.start,
				utc: { dayOfWeek: startFmt.ddd, time: startFmt.time },
				cron: {
					dayOfWeek: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(startUtc, 'dddd'),
					time: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(startUtc, 'HH:mm'),
				},
			};
			hour.finish = {
				time: hour.finish,
				utc: { dayOfWeek: finishFmt.ddd, time: finishFmt.time },
				cron: {
					dayOfWeek: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(finishUtc, 'dddd'),
					time: this.formatDayOfTheWeekFromServerTimezoneAndUtcHour(finishUtc, 'HH:mm'),
				},
			};
		});
		return businessHourData;
	}

	protected getUTCFromTimezone(timezone?: string): string {
		const d = new Date();
		const offsetMinutes = timezone ? tzOffset(timezone, d) : -d.getTimezoneOffset();
		const sign = offsetMinutes >= 0 ? '+' : '-';
		const h = Math.floor(Math.abs(offsetMinutes) / 60);
		const m = Math.abs(offsetMinutes) % 60;
		return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
	}

	private formatDayOfTheWeekFromServerTimezoneAndUtcHour(utc: Date, fmt: 'dddd' | 'HH:mm'): string {
		const serverOffsetMinutes = new Date().getTimezoneOffset();
		const local = addHours(utc, -serverOffsetMinutes / 60);
		return fmt === 'dddd' ? format(local, 'EEEE') : format(local, 'HH:mm');
	}
}
