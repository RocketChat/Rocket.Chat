import type { RoomType } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { usePermission, useSetModal, useSetting, useToastMessageDispatch, useUserSubscription, useUserId } from '@rocket.chat/ui-contexts';
import { createElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import useUserRoomCategoryForRoomModal from './useUserRoomCategoryForRoomModal';
import { useLeaveRoomAction } from './menuActions/useLeaveRoom';
import { useToggleFavoriteAction } from './menuActions/useToggleFavoriteAction';
import { useToggleReadAction } from './menuActions/useToggleReadAction';
import { useHideRoomAction } from './useHideRoomAction';
import { useUserRoomCategories } from './useUserRoomCategories';
import { useOmnichannelPrioritiesMenu } from '../views/omnichannel/hooks/useOmnichannelPrioritiesMenu';

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
}: RoomMenuActionsProps): { title: string; items: GenericMenuItemProps[] }[] => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const userId = useUserId();
	const subscription = useUserSubscription(rid);
	const { data: userRoomCategories = [], removeRoomFromCategory } = useUserRoomCategories();

	const userCategoryContainingRoom = userRoomCategories.find((c) => (c.roomIds ?? []).includes(rid));

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

	const handleHide = useHideRoomAction({ rid, type, name }, { redirect: false });
	const handleToggleFavorite = useToggleFavoriteAction({ rid, isFavorite });
	const handleToggleRead = useToggleReadAction({ rid, isUnread, subscription });
	const handleLeave = useLeaveRoomAction({ rid, type, name, roomOpen });

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
						userId &&
							!isOmnichannelRoom && {
								id: 'addUserRoomCategory',
								icon: 'sort-amount-down',
								content: t('Add_to_user_room_category'),
								onClick: () => {
									setModal(
										createElement(useUserRoomCategoryForRoomModal, {
											roomId: rid,
											roomName: name,
											onClose: () => setModal(null),
										}),
									);
								},
							},
						userCategoryContainingRoom && {
							id: 'removeUserRoomCategory',
							icon: 'cross',
							content: t('User_room_category_remove_room'),
							onClick: () => {
								void (async () => {
									try {
										await removeRoomFromCategory(userCategoryContainingRoom.name, rid);
										dispatchToastMessage({ type: 'success', message: t('User_room_category_remove_success') });
									} catch (error) {
										dispatchToastMessage({ type: 'error', message: error ?? t('Something_went_wrong') });
									}
								})();
							},
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
			userCategoryContainingRoom,
			removeRoomFromCategory,
			rid,
			name,
			dispatchToastMessage,
			setModal,
			userId,
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
