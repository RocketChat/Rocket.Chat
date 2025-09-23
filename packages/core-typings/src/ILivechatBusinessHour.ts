import type { ILivechatDepartment } from './ILivechatDepartment';

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

export interface ILivechatBusinessHour {
	_id: string;
	name: string;
	active: boolean;
	type: LivechatBusinessHourTypes;
	timezone: IBusinessHourTimezone;
	ts: Date;
	workHours: IBusinessHourWorkHour[];
	_updatedAt?: Date;
	departments?: ILivechatDepartment[];
}

export interface ISaveLivechatBusinessHour {
	_id?: string;
	name: string;
	active: boolean;
	type: LivechatBusinessHourTypes;
	daysOpen?: string[];
	daysTime?: {
		day: string;
		start: { time: string };
		finish: { time: string };
		open: boolean;
	}[];
	workHours: {
		day: string;
		start: string;
		finish: string;
		open: boolean;
	}[];
	timezone: string;
	timezoneName?: string;
	departmentsToApplyBusinessHour?: string;
}
