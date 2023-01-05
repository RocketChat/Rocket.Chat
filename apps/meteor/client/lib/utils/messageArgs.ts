import type { IMessage, IRoom, ISubscription, IUser, SettingValue } from '@rocket.chat/core-typings';

export const messageArgs = (
	context: any,
): {
	context?: 'threads' | 'mentions';
	msg: IMessage;
	u: IUser;
	room: IRoom;
	settings: Record<string, SettingValue>;
	groupable: boolean;
	hideRoles: boolean;
	subscription: ISubscription;
	customClass: string;
	templatePrefix: string;
	ignored: boolean;
	shouldCollapseReplies: boolean;
} => context?._arguments?.[1]?.hash || context;
