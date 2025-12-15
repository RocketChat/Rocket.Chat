import { isRoomFederated } from '@rocket.chat/core-typings';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { useUserAvatarPath, useUserId, useUserSubscription, useUserCard, useUserRoom } from '@rocket.chat/ui-contexts';
import { useMediaCallContext } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import type { UserInfoAction } from '../useUserInfoActions';

export const useUserMediaCallAction = (user: Pick<IUser, '_id' | 'username' | 'name'>, rid: IRoom['_id']): UserInfoAction | undefined => {
	const { t } = useTranslation();
	const ownUserId = useUserId();
	const { closeUserCard } = useUserCard();
	const { state, onToggleWidget } = useMediaCallContext();
	const getAvatarUrl = useUserAvatarPath();

	const currentSubscription = useUserSubscription(rid);
	const room = useUserRoom(rid);

	const blocked = currentSubscription?.blocked || currentSubscription?.blocker;

	if (room && isRoomFederated(room)) {
		return undefined;
	}

	if (state === 'unauthorized') {
		return undefined;
	}

	if (blocked) {
		return undefined;
	}

	const disabled = !['closed', 'new', 'unlicensed'].includes(state);

	if (user._id === ownUserId) {
		return undefined;
	}

	const avatarUrl = user.username ? getAvatarUrl({ username: user.username }) : getAvatarUrl({ userId: user._id });

	return {
		type: 'communication',
		title: t('Voice_call__user_', { user: user.name || user.username || '' }),
		icon: 'phone',
		onClick: () => {
			closeUserCard();
			onToggleWidget({
				userId: user._id,
				displayName: user.name || user.username || '',
				avatarUrl,
			});
		},
		disabled,
	};
};
