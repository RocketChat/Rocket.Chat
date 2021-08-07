export interface IUser {
	_id: string;
	username?: string;
	name?: string;
}

export interface IExtras {
	tmid?: string;
}

export type IActivity = { [key: string]: NodeJS.Timer }

export interface IRoomActivity {
	[activity: string]: IActivity;
}

export interface IActionsObject {
	[key: string]: IRoomActivity;
}
