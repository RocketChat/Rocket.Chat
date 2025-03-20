import { MessageComposerHint } from '@rocket.chat/ui-composer';
import type { ReactElement } from 'react';
import { memo } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { E2ERoomState } from '../../../../../app/e2e/client/E2ERoomState';
import { useRoom } from '../../contexts/RoomContext';
import { useE2EERoomState } from '../../hooks/useE2EERoomState';

type MessageBoxHintProps = {
	isEditing?: boolean;
	e2eEnabled?: boolean;
	unencryptedMessagesAllowed?: boolean;
	isMobile?: boolean;
};

const MessageBoxHint = ({ isEditing, e2eEnabled, unencryptedMessagesAllowed, isMobile }: MessageBoxHintProps): ReactElement | null => {
	const room = useRoom();
	const isReadOnly = room?.ro || false;
	const { t } = useTranslation();

	const e2eRoomState = useE2EERoomState(room._id);

	const isUnencryptedHintVisible =
		e2eEnabled &&
		unencryptedMessagesAllowed &&
		e2eRoomState &&
		e2eRoomState !== E2ERoomState.READY &&
		e2eRoomState !== E2ERoomState.DISABLED &&
		!isEditing &&
		!isReadOnly;

	if (!isEditing && !isUnencryptedHintVisible && !isReadOnly) {
		return null;
	}

	const renderHintText = (): string => {
		if (isEditing) {
			return t('Editing_message');
		}
		if (isReadOnly) {
			return t('This_room_is_read_only');
		}
		if (isUnencryptedHintVisible) {
			return t('E2EE_Composer_Unencrypted_Message');
		}
		return '';
	};

	return (
		<MessageComposerHint
			icon={isEditing ? 'pencil' : undefined}
			helperText={isEditing && !isMobile ? <Trans i18nKey='Editing_message_hint' /> : undefined}
		>
			{renderHintText()}
		</MessageComposerHint>
	);
};

export default memo(MessageBoxHint);
