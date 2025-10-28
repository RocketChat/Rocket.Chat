import type { IRoom, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export const useArchiveRoom = (room: Pick<IRoom, RoomAdminFieldsType>) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const archiveAction = useEndpoint('POST', '/v1/rooms.changeArchivationState');

	const handleArchive = useEffectEvent(async () => {
		try {
			await archiveAction({ rid: room._id, action: room.archived ? 'unarchive' : 'archive' });
			dispatchToastMessage({ type: 'success', message: room.archived ? t('Room_has_been_unarchived') : t('Room_has_been_archived') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return handleArchive;
};
