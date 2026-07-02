import type { RoomType } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { usePermission, useSetting, useUserSubscription, useSetModal, useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, createElement } from 'react';
import { useTranslation } from 'react-i18next';

import { subscriptionsQueryKeys } from '../lib/queryKeys';

import AddFolderModal from '../sidebar/AddFolderModal';

import { useLeaveRoomAction } from './menuActions/useLeaveRoom';
import { useToggleFavoriteAction } from './menuActions/useToggleFavoriteAction';
import { useToggleReadAction } from './menuActions/useToggleReadAction';
import { useHideRoomAction } from './useHideRoomAction';
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

	const handleHide = useHideRoomAction({ rid, type, name }, { redirect: false });
	const handleToggleFavorite = useToggleFavoriteAction({ rid, isFavorite });
	const handleToggleRead = useToggleReadAction({ rid, isUnread, subscription });
	const handleLeave = useLeaveRoomAction({ rid, type, name, roomOpen });

	const setModal = useSetModal();
	const saveDmFolder = useEndpoint('POST', '/v1/subscriptions.saveDmFolder');
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const handleNewFolder = useStableCallback(() => {
		setModal(createElement(AddFolderModal, { rid, defaultCreateNew: true, onClose: () => setModal(null) }));
	});

	const handleAddFolder = useStableCallback(() => {
		setModal(createElement(AddFolderModal, { rid, onClose: () => setModal(null) }));
	});

	const handleRemoveFromFolder = useStableCallback(async () => {
		try {
			await saveDmFolder({ roomId: rid, dmFolder: undefined });

			// Update local cache
			queryClient.setQueryData(subscriptionsQueryKeys.subscription(rid), (sub: any) =>
				sub ? { ...sub, dmFolder: undefined } : undefined
			);
			queryClient.invalidateQueries({ queryKey: ['subscriptions'] });

			dispatchToastMessage({
				type: 'success',
				message: t('Folder_cleared_successfully', 'Folder cleared successfully'),
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

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
					type === 'd' && !subscription?.dmFolder && {
						id: 'newFolder',
						icon: 'plus',
						content: t('New_Folder', 'New Folder'),
						onClick: handleNewFolder,
					},
					type === 'd' && {
						id: 'changeFolder',
						icon: 'folder',
						content: t('Add_Folder', 'Add Folder'),
						onClick: handleAddFolder,
					},
					type === 'd' && subscription?.dmFolder && {
						id: 'removeFromFolder',
						icon: 'circle-cross',
						content: t('Remove_from_Folder', 'Remove from Folder'),
						onClick: handleRemoveFromFolder,
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
			type,
			handleNewFolder,
			handleAddFolder,
			subscription?.dmFolder,
			handleRemoveFromFolder,
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
