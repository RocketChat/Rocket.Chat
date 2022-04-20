import { IRoom, IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useMemo } from 'react';

import { useMethod } from '../../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useUserRoom, useUserId, useUserSubscription } from '../../../../../contexts/UserContext';
import { Action } from '../../../../hooks/useActionSpread';
import { getRoomDirectives } from '../../../lib/getRoomDirectives';

export const useIgnoreUserAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): Action => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const { _id: uid } = user;
	const ownUserId = useUserId();
	const dispatchToastMessage = useToastMessageDispatch();
	const currentSubscription = useUserSubscription(rid);
	const isIgnored = currentSubscription?.ignored && currentSubscription?.ignored.indexOf(uid) > -1;

	const [roomCanIgnore] = getRoomDirectives(room);

	const ignoreUser = useMethod('ignoreUser');
	const ignoreUserAction = useMutableCallback(async () => {
		try {
			await ignoreUser({ rid, userId: uid, ignore: !isIgnored });
			if (isIgnored) {
				dispatchToastMessage({ type: 'success', message: t('User_has_been_unignored') });
			} else {
				dispatchToastMessage({ type: 'success', message: t('User_has_been_ignored') });
			}
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const ignoreUserOption = useMemo(
		() =>
			roomCanIgnore &&
			uid !== ownUserId && {
				label: t(isIgnored ? 'Unignore' : 'Ignore'),
				icon: 'ban',
				action: ignoreUserAction,
			},
		[ignoreUserAction, isIgnored, ownUserId, roomCanIgnore, t, uid],
	);

	return ignoreUserOption;
};
