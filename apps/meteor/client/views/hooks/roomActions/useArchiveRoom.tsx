import type { IRoom, RoomAdminFieldsType } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';

export const useArchiveRoom = (room: Pick<IRoom, RoomAdminFieldsType>) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const archiveAction = useEndpoint('POST', '/v1/rooms.changeArchivationState');

	const handleArchive = useMutableCallback(async () => {
		try {
			await archiveAction({ rid: room._id, action: room.archived ? 'unarchive' : 'archive' });
			dispatchToastMessage({ type: 'success', message: room.archived ? t('Room_has_been_unarchived') : t('Room_has_been_archived') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return handleArchive;
};
