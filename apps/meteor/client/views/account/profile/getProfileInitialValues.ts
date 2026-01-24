import type { AvatarObject, IUser } from '@rocket.chat/core-typings';

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
};

export const getProfileInitialValues = (user: IUser | null): AccountProfileFormValues => ({
	email: user ? getUserEmailAddress(user)?.trim() || '' : '',
	name: user?.name?.trim() ?? '',
	username: user?.username?.trim() ?? '',
	avatar: '' as AvatarObject,
	url: '',
	statusText: user?.statusText?.trim() ?? '',
	statusType: user?.status ?? '',
	bio: user?.bio?.trim() ?? '',
	customFields: user?.customFields ?? {},
	nickname: user?.nickname?.trim() ?? '',
});
