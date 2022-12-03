export type IUserAction = {
	_id: string;
	username?: string;
	name?: string;
};

export type IExtras = {
	tmid?: string;
};

export type IActivity = Record<string, NodeJS.Timeout>;

export type IRoomActivity = Record<'uploading' | 'typing' | 'recording', IActivity>;

export type IActionsObject = Record<string, IRoomActivity>;
