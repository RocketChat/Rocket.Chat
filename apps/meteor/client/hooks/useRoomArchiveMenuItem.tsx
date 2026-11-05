import type { RoomType } from '@rocket.chat/core-typings';
import { useIsEnterprise } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useArchiveRoomAction } from './useArchiveRoomAction';
import { useArchivedRooms } from './useArchivedRooms';
import { useHideRoomAction } from './useHideRoomAction';
import { useUnarchiveRoomAction } from './useUnarchiveRoomAction';

type UseRoomArchiveMenuItemOptions = {
	rid: string;
	type: RoomType;
	name: string;
	/** Whether hiding the room, where that is what the item does, leaves it for the home page. */
	redirect?: boolean;
};

/**
 * The item that takes a room out of the sidebar. On a licensed workspace it archives the room into the Archived
 * group, or unarchives an archived one; without a license, where there is no Archived group to keep it, it hides
 * the room as before.
 */
export type RoomArchiveMenuItem = {
	id: 'hideRoom' | 'unarchiveRoom' | 'archiveRoom';
	icon: 'eye-off' | 'undo' | 'archive';
	content: string;
	onClick: () => void;
};

export const useRoomArchiveMenuItem = ({ rid, type, name, redirect = true }: UseRoomArchiveMenuItemOptions): RoomArchiveMenuItem => {
	const { t } = useTranslation();
	const { data: { isEnterprise = false } = {} } = useIsEnterprise();
	const isArchived = useArchivedRooms().isArchivedRoom(rid);
	const handleArchive = useArchiveRoomAction({ rid, type, name });
	const handleUnarchive = useUnarchiveRoomAction({ rid });
	const handleHide = useHideRoomAction({ rid, type, name }, { redirect });

	if (!isEnterprise) {
		return { id: 'hideRoom', icon: 'eye-off', content: t('Hide'), onClick: handleHide };
	}

	if (isArchived) {
		return { id: 'unarchiveRoom', icon: 'undo', content: t('Unarchive'), onClick: handleUnarchive };
	}

	return { id: 'archiveRoom', icon: 'archive', content: t('Archive'), onClick: handleArchive };
};
