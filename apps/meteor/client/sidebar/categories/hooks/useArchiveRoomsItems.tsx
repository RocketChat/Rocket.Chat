import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { isActivityFilterable } from './useActivityFilter';
import { useCategoryModals } from './useCategoryModals';

export const ARCHIVE_INACTIVE_ROOMS_ITEM_ID = 'archive-inactive-rooms';

type UseArchiveRoomsItemsOptions = {
	groupKey: string;
	/** The group as its header names it, for the modal's title. */
	groupTitle: string;
	/** Every room of the group, the ones the collapse or the filter leaves out included. */
	rooms: SubscriptionWithRoom[];
	/** Called as the item opens its modal, so the owner can close the menu. */
	onOpen?: () => void;
};

/**
 * The menu item that opens the modal archiving the group's quiet rooms at once. A dynamic group lists rooms
 * that need attention right now, so it has none.
 */
export const useArchiveRoomsItems = ({ groupKey, groupTitle, rooms, onOpen }: UseArchiveRoomsItemsOptions): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const { openArchiveRooms } = useCategoryModals();

	return useMemo(
		() =>
			isActivityFilterable(groupKey)
				? [
						{
							id: ARCHIVE_INACTIVE_ROOMS_ITEM_ID,
							icon: 'archive',
							content: t('Archive_rooms_ellipsis'),
							onClick: () => {
								onOpen?.();
								openArchiveRooms({ groupTitle, rooms });
							},
						},
					]
				: [],
		[t, groupKey, groupTitle, rooms, onOpen, openArchiveRooms],
	);
};
