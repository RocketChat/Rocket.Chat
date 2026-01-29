import { useRoomToolbox, useRouteParameter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import MediaCallHistoryContextualbar from './MediaCallHistoryContextualbar';
import { useRoom } from '../room/contexts/RoomContext';

const MediaCallHistoryContextualbarRoom = () => {
	const room = useRoom();
	const toolbox = useRoomToolbox();
	const context = useRouteParameter('context');
	const openUserInfo = useCallback(
		(userId: string) => {
			toolbox.openTab('user-info', userId);
		},
		[toolbox],
	);

	return <MediaCallHistoryContextualbar callId={context} openRoomId={room._id} openUserInfo={openUserInfo} onClose={toolbox.closeTab} />;
};

export default MediaCallHistoryContextualbarRoom;
