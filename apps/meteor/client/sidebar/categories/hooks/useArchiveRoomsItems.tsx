import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { isActivityFilterable } from './useActivityFilter';
import { useCategoryModals } from './useCategoryModals';

/** What the archive goes by: a date the rooms have been quiet since, or how long they have been quiet for. */
export type ArchiveRoomsMode = 'inactive-since' | 'older-than';

export const ARCHIVE_ROOMS_ITEM_IDS: Record<ArchiveRoomsMode, string> = {
	'inactive-since': 'archive-inactive-since',
	'older-than': 'archive-older-than',
};

type UseArchiveRoomsItemsOptions = {
	groupKey: string;
	/** The group as its header names it, for the modal's title. */
	groupTitle: string;
	/** Every room of the group, the ones the collapse or the filter leaves out included. */
	rooms: SubscriptionWithRoom[];
	/** Called as an item opens its modal, so the owner can close the menu. */
	onOpen?: () => void;
};

/**
 * The Archive submenu's items: each opens the modal that archives the group's quiet rooms, by a date or by an
 * age. A dynamic group lists rooms that need attention right now, so it has none.
 */
export const useArchiveRoomsItems = ({ groupKey, groupTitle, rooms, onOpen }: UseArchiveRoomsItemsOptions): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const { openArchiveRooms } = useCategoryModals();

	return useMemo(() => {
		if (!isActivityFilterable(groupKey)) {
			return [];
		}

		const item = (mode: ArchiveRoomsMode, content: string): GenericMenuItemProps => ({
			id: ARCHIVE_ROOMS_ITEM_IDS[mode],
			content,
			onClick: () => {
				onOpen?.();
				openArchiveRooms({ mode, groupTitle, rooms });
			},
		});

		return [item('inactive-since', t('Inactive_since_ellipsis')), item('older-than', t('Older_than_ellipsis'))];
	}, [t, groupKey, groupTitle, rooms, onOpen, openArchiveRooms]);
};
