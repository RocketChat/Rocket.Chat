import type { RoomType } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { usePermission, useSetting, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useLeaveRoomAction } from './menuActions/useLeaveRoom';
import { useToggleFavoriteAction } from './menuActions/useToggleFavoriteAction';
import { useToggleReadAction } from './menuActions/useToggleReadAction';
import { useRoomArchiveMenuItem } from './useRoomArchiveMenuItem';
import { useOmnichannelPrioritiesMenu } from '../views/omnichannel/hooks/useOmnichannelPrioritiesMenu';

export type RoomMenuSection = {
	title: string;
	items: GenericMenuItemProps[];
};

type RoomMenuActionsProps = {
	rid: string;
	type: RoomType;
	name: string;
	isUnread?: boolean;
	cl?: boolean;
	roomOpen?: boolean;
	hideDefaultOptions: boolean;
};

export const useRoomMenuActions = ({
	rid,
	type,
	name,
	isUnread,
	cl,
	roomOpen,
	hideDefaultOptions,
}: RoomMenuActionsProps): RoomMenuSection[] => {
	const { t } = useTranslation();
	const subscription = useUserSubscription(rid);

	const isFavorite = Boolean(subscription?.f);
	const canLeaveChannel = usePermission('leave-c');
	const canLeavePrivate = usePermission('leave-p');
	const canFavorite = useSetting('Favorite_Rooms') as boolean;

	const canLeave = ((): boolean => {
		if (type === 'c' && !canLeaveChannel) {
			return false;
		}
		if (type === 'p' && !canLeavePrivate) {
			return false;
		}
		return !((cl != null && !cl) || ['d', 'l'].includes(type));
	})();

	const archiveItem = useRoomArchiveMenuItem({ rid, type, name, redirect: false });
	const handleToggleFavorite = useToggleFavoriteAction({ rid, isFavorite });
	const handleToggleRead = useToggleReadAction({ rid, isUnread, subscription });
	const handleLeave = useLeaveRoomAction({ rid, type, name, roomOpen });

	const isOmnichannelRoom = type === 'l';
	const prioritiesMenu = useOmnichannelPrioritiesMenu(rid);

	const menuOptions = useMemo(
		() =>
			!hideDefaultOptions
				? ([
						!isOmnichannelRoom && archiveItem,
						{
							id: 'toggleRead',
							icon: 'flag',
							content: isUnread ? t('Mark_read') : t('Mark_unread'),
							onClick: handleToggleRead,
						},
						canFavorite && {
							id: 'toggleFavorite',
							icon: isFavorite ? 'star-filled' : 'star',
							content: isFavorite ? t('Unfavorite') : t('Favorite'),
							onClick: handleToggleFavorite,
						},
						canLeave && {
							id: 'leaveRoom',
							icon: 'sign-out',
							content: t('Leave_room'),
							onClick: handleLeave,
						},
					].filter(Boolean) as GenericMenuItemProps[])
				: [],
		[
			hideDefaultOptions,
			t,
			archiveItem,
			isUnread,
			handleToggleRead,
			canFavorite,
			isFavorite,
			handleToggleFavorite,
			canLeave,
			handleLeave,
			isOmnichannelRoom,
		],
	);

	if (isOmnichannelRoom && prioritiesMenu.length > 0) {
		return [
			...(menuOptions.length > 0 ? [{ title: '', items: menuOptions }] : []),
			...(prioritiesMenu.length > 0 ? [{ title: t('Priorities'), items: prioritiesMenu }] : []),
		];
	}

	return menuOptions.length > 0 ? [{ title: '', items: menuOptions }] : [];
};
