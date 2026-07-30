import type { IUser } from '@rocket.chat/core-typings';
import { useRouter, useUserId } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { UserInfoAction } from '../useUserInfoActions';

export const useEditProfileAction = (user: Pick<IUser, '_id' | 'username'>): UserInfoAction | undefined => {
	const { t } = useTranslation();
	const router = useRouter();
	const ownUserId = useUserId();

	const editProfileOption = useMemo(() => {
		if (!user._id || user._id !== ownUserId) {
			return undefined;
		}

		return {
			content: t('Edit'),
			icon: 'pencil' as const,
			onClick: () => router.navigate('/account/profile'),
			type: 'management',
		} as const;
	}, [user._id, ownUserId, router, t]);

	return editProfileOption;
};
