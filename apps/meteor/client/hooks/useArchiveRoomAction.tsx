import type { RoomType } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import { GenericModalDoNotAskAgain, useDontAskAgain } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useArchivedRooms } from './useArchivedRooms';

type ArchiveRoomProps = {
	rid: string;
	type: RoomType;
	name: string;
};

/** What archiving does, told for the room's own type. */
const ARCHIVE_DESCRIPTION_BY_ROOM_TYPE = {
	c: 'Archive_Channel_Description',
	p: 'Archive_Group_Description',
	d: 'Archive_Direct_Description',
	l: 'Archive_Livechat_Description',
} as const satisfies Record<RoomType, RocketchatI18nKeys>;

/**
 * Archives one room out of the sidebar, after telling what that means, unless the user asked not to be told
 * again. Unarchiving it is one click away, in the Archived group.
 */
export const useArchiveRoomAction = ({ rid, type, name }: ArchiveRoomProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const closeModal = useStableCallback(() => setModal());
	const dontAskArchiveRoom = useDontAskAgain('archiveRoom');
	const { archiveRooms } = useArchivedRooms();

	return useStableCallback(() => {
		if (dontAskArchiveRoom) {
			archiveRooms([rid]);
			return;
		}

		setModal(
			<GenericModalDoNotAskAgain
				icon={null}
				title={t('Archive_room')}
				confirmText={t('Archive')}
				cancelText={t('Cancel')}
				onClose={closeModal}
				onCancel={closeModal}
				onConfirm={() => {
					archiveRooms([rid]);
					closeModal();
				}}
				dontAskAgain={{
					action: 'archiveRoom',
					label: t('Archive_room'),
				}}
			>
				{t(ARCHIVE_DESCRIPTION_BY_ROOM_TYPE[type], { roomName: name })}
			</GenericModalDoNotAskAgain>,
		);
	});
};
