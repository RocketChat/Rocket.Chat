import type { AvatarObject, IUser } from '@rocket.chat/core-typings';

import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import type { UserStatusInitialValues } from '../../../lib/getUserInitialStatus';
import { getUserStatusInitialValues } from '../../../lib/getUserInitialStatus';

export type AccountProfileFormValues = {
	email: string;
	name: string;
	username: string;
	avatar: AvatarObject;
	url: string;
	bio: string;
	title: string;
	nationality: string;
	languages: string;
	customFields: Record<string, string>;
	nickname: string;
} & UserStatusInitialValues;

export const getProfileInitialValues = (user: IUser | null): AccountProfileFormValues => {
	return {
		email: user ? getUserEmailAddress(user) || '' : '',
		name: user?.name ?? '',
		username: user?.username ?? '',
		avatar: '' as AvatarObject,
		url: '',
		bio: user?.bio ?? '',
		title: user?.title ?? '',
		nationality: user?.nationality ?? '',
		languages: user?.languages?.join(', ') ?? '',
		customFields: user?.customFields ?? {},
		nickname: user?.nickname ?? '',
		...getUserStatusInitialValues(user),
	};
};
