import type { IRoom } from '@rocket.chat/core-typings';
import { isDiscussion, isPublicRoom } from '@rocket.chat/core-typings';
import { MessageFooterCallout, MessageFooterCalloutAction, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../contexts/RoomContext';
import { ABAC_ATTRIBUTES_MANAGE_CONTEXT, ABAC_ATTRIBUTES_TAB } from '../contextualBar/AbacAttributes/abacAttributesTab';
import { useCanManageRoomAbacAttributes } from '../hooks/useCanManageRoomAbacAttributes';

const getLockedMessageKey = (room: IRoom) => {
	const unlockableKey = room.teamMain ? 'ABAC_Room_locked_team' : 'ABAC_Room_locked_channel';

	// Same precedence as `isRoomAbacLocked`, so the copy always names the rule that locked the room.
	if (isDiscussion(room)) {
		return 'ABAC_Room_locked_discussion';
	}

	if (isPublicRoom(room)) {
		return 'ABAC_Room_locked_public';
	}

	return unlockableKey;
};

const ComposerAbacLocked = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const { openTab } = useRoomToolbox();
	const canManage = useCanManageRoomAbacAttributes(room);

	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent>{t(getLockedMessageKey(room))}</MessageFooterCalloutContent>
			{canManage && (
				<MessageFooterCalloutAction onClick={() => openTab(ABAC_ATTRIBUTES_TAB, ABAC_ATTRIBUTES_MANAGE_CONTEXT)}>
					{t('ABAC_Manage_attributes')}
				</MessageFooterCalloutAction>
			)}
		</MessageFooterCallout>
	);
};

export default ComposerAbacLocked;
