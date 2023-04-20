import type { IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useUserSubscription, useUserId, useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import type { Action } from '../../../../hooks/useActionSpread';
import { useRoom } from '../../../contexts/RoomContext';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';

export const useIgnoreUserAction = (user: Pick<IUser, '_id' | 'username'>): Action | undefined => {
	const t = useTranslation();
	const room = useRoom();
	const { _id: uid } = user;
	const ownUserId = useUserId();
	const dispatchToastMessage = useToastMessageDispatch();
	const currentSubscription = useUserSubscription(room._id);
	const ignoreUser = useEndpoint('GET', '/v1/chat.ignoreUser');

	const isIgnored = currentSubscription?.ignored && currentSubscription.ignored.indexOf(uid) > -1;

	const { roomCanIgnore } = getRoomDirectives({ room, showingUserId: uid, userSubscription: currentSubscription });

	const ignoreUserAction = useMutableCallback(async () => {
		try {
			await ignoreUser({ rid: room._id, userId: uid, ignore: String(!isIgnored) });
			if (isIgnored) {
				dispatchToastMessage({ type: 'success', message: t('User_has_been_unignored') });
			} else {
				dispatchToastMessage({ type: 'success', message: t('User_has_been_ignored') });
			}
		} catch (error: unknown) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const ignoreUserOption = useMemo(
		() =>
			roomCanIgnore && uid !== ownUserId
				? {
						label: t(isIgnored ? 'Unignore' : 'Ignore'),
						icon: 'ban' as const,
						action: ignoreUserAction,
				  }
				: undefined,
		[ignoreUserAction, isIgnored, ownUserId, roomCanIgnore, t, uid],
	);

	return ignoreUserOption;
};
