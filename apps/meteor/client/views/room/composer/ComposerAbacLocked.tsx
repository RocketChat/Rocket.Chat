import { Button } from '@rocket.chat/fuselage';
import { MessageFooterCallout, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { usePermission, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useRoom } from '../contexts/RoomContext';

/**
 * Composer state for a room locked by ABAC enforcement (ABAC-P4 M1, Figma 4543:30116 / 4893:18036).
 *
 * Two variants: a member entitled to edit the room's attributes is offered the way out, everyone
 * else is told who can act. The entitlement is `edit-room-abac-attributes` (D14), scoped to this
 * room.
 */
const ComposerAbacLocked = () => {
	const { t } = useTranslation();
	const room = useRoom();
	const { openTab } = useRoomToolbox();

	const canEditAttributes = usePermission('edit-room-abac-attributes', room._id);

	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent>
				{canEditAttributes ? t('ABAC_Room_locked_owner') : t('ABAC_Room_locked_member')}
			</MessageFooterCalloutContent>
			{canEditAttributes && (
				<Button primary onClick={() => openTab('channel-settings', 'edit')}>
					{t('Edit_channel')}
				</Button>
			)}
		</MessageFooterCallout>
	);
};

export default ComposerAbacLocked;
