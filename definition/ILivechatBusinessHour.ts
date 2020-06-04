export enum LivechatBussinessHourTypes {
	SINGLE = 'single',
}

export interface IBusinessHourWorkHour {
	day: string;
	start: string;
	finish: string;
	open: boolean;
}

export interface ILivechatBusinessHour {
	_id: string;
	name: string;
	active: boolean;
	type: LivechatBussinessHourTypes;
	ts: Date;
	workHours: IBusinessHourWorkHour[];
	_updatedAt?: Date;
}
