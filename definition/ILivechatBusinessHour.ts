import { ILivechatDepartment } from './ILivechatDepartment';

export enum LivechatBussinessHourTypes {
	SINGLE = 'single',
	MULTIPLE = 'multiple',
}

export interface IBusinessHourWorkHour {
	dayOfWeek: number;
	start: { time: string; utc: { dayOfWeek: string; time: string }; cron: { dayOfWeek: string; time: string } };
	finish: { time: string; utc: { dayOfWeek: string; time: string }; cron: { dayOfWeek: string; time: string } };
	open: boolean;
}

export interface IBusinessHourTimezone {
	name: string;
	utc: string;
}

export interface ILivechatBusinessHour {
	_id: string;
	name: string;
	active: boolean;
	type: LivechatBussinessHourTypes;
	timezone: IBusinessHourTimezone;
	ts: Date;
	workHours: IBusinessHourWorkHour[];
	_updatedAt?: Date;
	departments?: ILivechatDepartment[];
}
