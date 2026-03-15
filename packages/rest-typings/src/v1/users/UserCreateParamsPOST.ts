import type { IUserSettings } from '@rocket.chat/core-typings';

export type UserCreateParamsPOST = {
	email: string;
	name: string;
	password: string;
	username: string;
	active?: boolean;
	bio?: string;
	nickname?: string;
	statusText?: string;
	roles?: string[];
	joinDefaultChannels?: boolean;
	requirePasswordChange?: boolean;
	setRandomPassword?: boolean;
	sendWelcomeEmail?: boolean;
	verified?: boolean;
	customFields?: Record<string, any>;
	settings?: IUserSettings;
	freeSwitchExtension?: string;
	/* @deprecated */
	fields: string;
};
