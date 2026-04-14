import type { RoomType } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { usePermission, useRouter, useSetting, useUserSubscription } from '@rocket.chat/ui-contexts';
import type { LocationPathname } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useLeaveRoomAction } from '../../../../hooks/menuActions/useLeaveRoom';
import { useToggleFavoriteAction } from '../../../../hooks/menuActions/useToggleFavoriteAction';
import { useToggleNotificationAction } from '../../../../hooks/menuActions/useToggleNotificationsAction';
import { useToggleReadAction } from '../../../../hooks/menuActions/useToggleReadAction';
import { useHideRoomAction } from '../../../../hooks/useHideRoomAction';
import { useOmnichannelPrioritiesMenu } from '../../../omnichannel/hooks/useOmnichannelPrioritiesMenu';

type RoomMenuActionsProps = {
	rid: string;
	type: RoomType;
	name: string;
	isUnread?: boolean;
	cl?: boolean;
	roomOpen?: boolean;
	hideDefaultOptions: boolean;
	href: LocationPathname | undefined;
};

export const useRoomMenuActions = ({
	rid,
	type,
	name,
	isUnread,
	cl,
	roomOpen,
	hideDefaultOptions,
	href,
}: RoomMenuActionsProps): { title: string; items: GenericMenuItemProps[] }[] => {
	const { t } = useTranslation();
	const subscription = useUserSubscription(rid);
	const router = useRouter();

	const isFavorite = Boolean(subscription?.f);
	const canLeaveChannel = usePermission('leave-c');
	const canLeavePrivate = usePermission('leave-p');
	const canFavorite = useSetting('Favorite_Rooms', true);
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

	const roomMenuOptions = useMemo<GenericMenuItemProps[]>(() => {
		if (hideDefaultOptions || !subscription) {
			return [];
		}

		const options: (GenericMenuItemProps | false)[] = [
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
		];
		return options.filter(Boolean) as GenericMenuItemProps[];
	}, [
		hideDefaultOptions,
		subscription,
		isOmnichannelRoom,
		t,
		handleHide,
		isUnread,
		handleToggleRead,
		canFavorite,
		isFavorite,
		handleToggleFavorite,
		canLeave,
		handleLeave,
	]);

	const notificationsMenuOptions = useMemo<GenericMenuItemProps[]>(() => {
		if (!subscription || hideDefaultOptions || isOmnichannelRoom || !href) {
			return [];
		}

		const options: GenericMenuItemProps[] = [
			{
				id: 'turnOnNotifications',
				icon: isNotificationEnabled ? 'bell' : 'bell-off',
				content: isNotificationEnabled ? t('Turn_OFF') : t('Turn_ON'),
				onClick: handleToggleNotification,
			},
			{
				id: 'notifications',
				icon: 'customize',
				content: t('Preferences'),
				onClick: () => router.navigate(`${href}/push-notifications` as LocationPathname),
			},
		];
		return options.filter(Boolean);
	}, [hideDefaultOptions, isNotificationEnabled, subscription, t, router, href, handleToggleNotification, isOmnichannelRoom]);

	if (isOmnichannelRoom) {
		return [
			...(roomMenuOptions.length > 0 ? [{ title: '', items: roomMenuOptions }] : []),
			...(prioritiesMenu.length > 0 ? [{ title: t('Priorities'), items: prioritiesMenu }] : []),
		];
	}

	return [
		...(roomMenuOptions.length > 0 ? [{ title: '', items: roomMenuOptions }] : []),
		...(notificationsMenuOptions.length > 0 ? [{ title: t('Notifications'), items: notificationsMenuOptions }] : []),
	];
};
