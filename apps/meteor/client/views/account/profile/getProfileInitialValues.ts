import type { AvatarObject, IUser, IUserPhoneNumber } from '@rocket.chat/core-typings';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';

export type AccountProfileFormValues = {
	email: string;
	name: string;
	username: string;
	avatar: AvatarObject;
	url: string;
	statusText: string;
	statusType: string;
	bio: string;
	customFields: Record<string, string>;
	nickname: string;
	phones: IUserPhoneNumber[];
};

export const getProfileInitialValues = (user: IUser | null): AccountProfileFormValues => ({
	email: user ? getUserEmailAddress(user) || '' : '',
	name: user?.name ?? '',
	username: user?.username ?? '',
	avatar: '' as AvatarObject,
	url: '',
	statusText: user?.statusText ?? '',
	statusType: user?.status ?? '',
	bio: user?.bio ?? '',
	customFields: user?.customFields ?? {},
	nickname: user?.nickname ?? '',
	phones: user?.phones ?? (user?.phone ? [{ number: user.phone }] : []),
});
