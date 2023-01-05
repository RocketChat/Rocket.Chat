import type { IRoom, IUser, ISubscription } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, usePermission, useRoute, useUserSubscription, useUserSubscriptionByName } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { Action } from '../../../../hooks/useActionSpread';

const getShouldOpenDirectMessage = (
	currentSubscription?: ISubscription,
	usernameSubscription?: ISubscription,
	canOpenDirectMessage?: boolean,
	username?: IUser['username'],
): boolean => {
	const canOpenDm = canOpenDirectMessage || usernameSubscription;
	const directMessageIsNotAlreadyOpen = currentSubscription && currentSubscription.name !== username;
	return (canOpenDm && directMessageIsNotAlreadyOpen) ?? false;
};

export const useDirectMessageAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): Action | undefined => {
	const t = useTranslation();
	const usernameSubscription = useUserSubscriptionByName(user.username ?? '');
	const currentSubscription = useUserSubscription(rid);
	const canOpenDirectMessage = usePermission('create-d');
	const directRoute = useRoute('direct');

	const shouldOpenDirectMessage = getShouldOpenDirectMessage(
		currentSubscription,
		usernameSubscription,
		canOpenDirectMessage,
		user.username,
	);

	const openDirectMessage = useMutableCallback(
		() =>
			user.username &&
			directRoute.push({
				rid: user.username,
			}),
	);

	const openDirectMessageOption = useMemo(
		() =>
			shouldOpenDirectMessage
				? {
						label: t('Direct_Message'),
						icon: 'balloon',
						action: openDirectMessage,
				  }
				: undefined,
		[openDirectMessage, shouldOpenDirectMessage, t],
	);

	return openDirectMessageOption;
};
