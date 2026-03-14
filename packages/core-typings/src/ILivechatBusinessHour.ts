import type { ILivechatDepartment } from './ILivechatDepartment';
import type { IRocketChatRecord } from './IRocketChatRecord';

export enum LivechatBusinessHourTypes {
	DEFAULT = 'default',
	CUSTOM = 'custom',
}

export enum LivechatBusinessHourBehaviors {
	SINGLE = 'Single',
	MULTIPLE = 'Multiple',
}

interface IBusinessHourTime {
	time: string;
	utc: { dayOfWeek: string; time: string };
	cron: { dayOfWeek: string; time: string };
}

export interface IBusinessHourWorkHour {
	day: string;
	start: IBusinessHourTime;
	finish: IBusinessHourTime;
	open: boolean;
	code: unknown;
}

export interface IBusinessHourTimezone {
	name: string;
	utc: string;
}

export interface ILivechatBusinessHour extends IRocketChatRecord {
	name: string;
	active: boolean;
	type: LivechatBusinessHourTypes;
	timezone: IBusinessHourTimezone;
	ts: Date;
	workHours: IBusinessHourWorkHour[];
	departments?: ILivechatDepartment[];
}
