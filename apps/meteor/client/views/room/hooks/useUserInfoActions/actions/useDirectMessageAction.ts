import { IRoom, IUser, ISubscription } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useMemo } from 'react';

import { usePermission } from '../../../../../contexts/AuthorizationContext';
import { useRoute } from '../../../../../contexts/RouterContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useUserSubscription, useUserSubscriptionByName } from '../../../../../contexts/UserContext';
import { Action } from '../../../../hooks/useActionSpread';

const getShouldOpenDirectMessage = (
	currentSubscription?: ISubscription,
	usernameSubscription?: ISubscription,
	canOpenDirectMessage?: boolean,
	username?: IUser['username'],
): boolean => {
	const canOpenDm = canOpenDirectMessage || usernameSubscription;
	const directMessageIsNotAlreadyOpen = currentSubscription && currentSubscription.name !== username;
	return canOpenDm && directMessageIsNotAlreadyOpen;
};

export const useDirectMessageAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): Action => {
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
			shouldOpenDirectMessage && {
				label: t('Direct_Message'),
				icon: 'balloon',
				action: openDirectMessage,
			},
		[openDirectMessage, shouldOpenDirectMessage, t],
	);

	return openDirectMessageOption;
};
