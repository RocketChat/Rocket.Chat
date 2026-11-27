import type { RoomType } from '@rocket.chat/core-typings';
import { ToggleSwitch } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { usePermission, useSetting, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useLeaveRoomAction } from './menuActions/useLeaveRoom';
import { useToggleFavoriteAction } from './menuActions/useToggleFavoriteAction';
import { useToggleNotificationAction } from './menuActions/useToggleNotificationsAction';
import { useToggleReadAction } from './menuActions/useToggleReadAction';
import { useHideRoomAction } from './useHideRoomAction';
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
	const hasSubscription = Boolean(subscription);
	const isNotificationEnabled = !subscription?.disableNotifications;

	const canLeave = ((): boolean => {
		if (type === 'c' && !canLeaveChannel) {
			return false;
		}
		if (type === 'p' && !canLeavePrivate) {
			return false;
		}
		return !((cl != null && !cl) || ['d', 'l'].includes(type));
	})();

	const handleHide = useHideRoomAction({ rid, type, name }, { redirect: false });
	const handleToggleFavorite = useToggleFavoriteAction({ rid, isFavorite });
	const handleToggleRead = useToggleReadAction({ rid, isUnread, subscription });
	const handleLeave = useLeaveRoomAction({ rid, type, name, roomOpen });
	const handleToggleNotification = useToggleNotificationAction({ rid, isNotificationEnabled, roomName: name });

	const isOmnichannelRoom = type === 'l';
	const prioritiesMenu = useOmnichannelPrioritiesMenu(rid);

	const menuOptions = useMemo(
		() =>
			!hideDefaultOptions
				? ([
						!isOmnichannelRoom && {
							id: 'hideRoom',
							icon: 'eye-off',
							content: t('Hide'),
							onClick: handleHide,
						},
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
			handleHide,
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

	// The room's notifications, under a section of their own: the item says what it does next ("Turn off" while
	// they are sent), which is also how a screen reader learns the state; the switch beside it only shows the same
	// state, so it is kept out of the accessibility tree and the tab order. An omnichannel room has no such preference.
	const notificationsMenuOptions = useMemo<GenericMenuItemProps[]>(
		() =>
			!hideDefaultOptions && !isOmnichannelRoom && hasSubscription
				? [
						{
							id: 'notifications',
							icon: 'bell',
							content: isNotificationEnabled ? t('Turn_OFF') : t('Turn_ON'),
							textValue: isNotificationEnabled ? t('Turn_OFF') : t('Turn_ON'),
							onClick: handleToggleNotification,
							addon: <ToggleSwitch checked={isNotificationEnabled} aria-hidden tabIndex={-1} onChange={() => undefined} />,
						},
					]
				: [],
		[hideDefaultOptions, isOmnichannelRoom, hasSubscription, isNotificationEnabled, t, handleToggleNotification],
	);

	if (isOmnichannelRoom && prioritiesMenu.length > 0) {
		return [
			...(menuOptions.length > 0 ? [{ title: '', items: menuOptions }] : []),
			...(prioritiesMenu.length > 0 ? [{ title: t('Priorities'), items: prioritiesMenu }] : []),
		];
	}

	return [
		...(menuOptions.length > 0 ? [{ title: '', items: menuOptions }] : []),
		...(notificationsMenuOptions.length > 0 ? [{ title: t('Notifications'), items: notificationsMenuOptions }] : []),
	];
};
