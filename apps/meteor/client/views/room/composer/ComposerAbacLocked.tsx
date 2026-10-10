import type { IRoom } from '@rocket.chat/core-typings';
import { isPublicRoom } from '@rocket.chat/core-typings';
import { MessageFooterCallout, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../contexts/RoomContext';

const getLockedMessageKey = (room: IRoom) => {
	if (isPublicRoom(room)) {
		return 'ABAC_Room_locked_public';
	}

	return 'ABAC_Room_locked_member';
};

const ComposerAbacLocked = () => {
	const { t } = useTranslation();
	const room = useRoom();

	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent>{t(getLockedMessageKey(room))}</MessageFooterCalloutContent>
		</MessageFooterCallout>
	);
};

export default ComposerAbacLocked;
