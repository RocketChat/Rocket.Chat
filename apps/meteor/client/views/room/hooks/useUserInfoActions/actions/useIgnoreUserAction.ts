import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import {
	useTranslation,
	useUserSubscription,
	useUserRoom,
	useUserId,
	useToastMessageDispatch,
	useEndpoint,
} from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { getRoomDirectives } from '../../../lib/getRoomDirectives';
import type { UserInfoAction, UserInfoActionType } from '../useUserInfoActions';

export const useIgnoreUserAction = (user: Pick<IUser, '_id' | 'username'>, rid: IRoom['_id']): UserInfoAction | undefined => {
	const t = useTranslation();
	const room = useUserRoom(rid);
	const { _id: uid } = user;
	const ownUserId = useUserId();
	const dispatchToastMessage = useToastMessageDispatch();
	const currentSubscription = useUserSubscription(rid);
	const ignoreUser = useEndpoint('GET', '/v1/chat.ignoreUser');

	const isIgnored = currentSubscription?.ignored && currentSubscription.ignored.indexOf(uid) > -1;

	if (!room) {
		throw Error('Room not provided');
	}

	const { roomCanIgnore } = getRoomDirectives({ room, showingUserId: uid, userSubscription: currentSubscription });

	const ignoreUserAction = useEffectEvent(async () => {
		try {
			await ignoreUser({ rid, userId: uid, ignore: String(!isIgnored) });
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
						content: t(isIgnored ? 'Unignore' : 'Ignore'),
						icon: 'ban' as const,
						onClick: ignoreUserAction,
						type: 'management' as UserInfoActionType,
					}
				: undefined,
		[ignoreUserAction, isIgnored, ownUserId, roomCanIgnore, t, uid],
	);

	return ignoreUserOption;
};
