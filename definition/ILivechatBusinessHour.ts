export enum LivechatBussinessHourTypes {
	SINGLE = 'single',
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
}

export interface IBusinessHourTimezone {
	name: string;
	utc: number;
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
}
