import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useUserId, useUserPresence } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import MarkdownText from '../../../components/MarkdownText';
import { useExpirationText } from '../../../hooks/useExpirationText';
import { getUidDirectMessage } from '../../../lib/utils/getUidDirectMessage';

type RoomMemberStatusProps = {
	room: IRoom;
};

const RoomMemberStatus = ({ room }: RoomMemberStatusProps): ReactElement | null => {
	const directUserId = getUidDirectMessage(room, useUserId());
	const presence = useUserPresence(directUserId);
	const expirationText = useExpirationText(presence?.statusExpiresAt);

	if (!presence?.statusText && !presence?.statusExpiresAt) {
		return null;
	}

	return (
		<Box title={expirationText}>
			<MarkdownText content={presence?.statusText} parseEmoji={true} variant='inline' />
		</Box>
	);
};

export default RoomMemberStatus;
