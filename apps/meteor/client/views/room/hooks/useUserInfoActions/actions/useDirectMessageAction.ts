import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useGoToDirectMessage } from '@rocket.chat/ui-client';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { UserInfoAction } from '../useUserInfoActions';

export const useDirectMessageAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): UserInfoAction | undefined => {
	const { t } = useTranslation();

	const openDirectMessage = useGoToDirectMessage(user, rid);

	const openDirectMessageOption = useMemo(() => {
		if (!openDirectMessage) {
			return undefined;
		}

		return {
			content: t('Direct_Message'),
			icon: 'balloon' as const,
			onClick: openDirectMessage,
			type: 'communication',
		} as const;
	}, [openDirectMessage, t]);

	return openDirectMessageOption;
};
