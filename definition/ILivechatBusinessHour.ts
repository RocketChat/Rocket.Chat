export enum LivechatBussinessHourTypes {
	SINGLE = 'single',
	MULTIPLE = 'multiple',
}

export interface IBusinessHourWorkHour {
	day: string;
	start: string;
	finish: string;
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
}
