import type { AvatarObject, IUser } from '@rocket.chat/core-typings';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';

export type AccountProfileFormValues = {
	email: string;
	name: string;
	username: string;
	avatar: AvatarObject;
	url: string;
	statusText: string;
	statusType: IUser['status'];
	statusDuration: string;
	statusCustomDate: string;
	statusCustomTime: string;
	bio: string;
	customFields: Record<string, string>;
	nickname: string;
};

export const getProfileInitialValues = (user: IUser | null): AccountProfileFormValues => {
	const expiration = user?.statusExpiresAt && new Date(user.statusExpiresAt) > new Date() ? new Date(user.statusExpiresAt) : null;
	const date = expiration ?? new Date();
	return {
		email: user ? getUserEmailAddress(user) || '' : '',
		name: user?.name ?? '',
		username: user?.username ?? '',
		avatar: '' as AvatarObject,
		url: '',
		statusText: user?.statusText ?? '',
		statusType: user?.status,
		statusDuration: expiration ? 'custom' : '',
		statusCustomDate: date.toLocaleDateString('en-CA'),
		statusCustomTime: date.toTimeString().slice(0, 5),
		bio: user?.bio ?? '',
		customFields: user?.customFields ?? {},
		nickname: user?.nickname ?? '',
	};
};
