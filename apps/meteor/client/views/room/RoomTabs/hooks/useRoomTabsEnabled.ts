import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { useLayout, useSetting } from '@rocket.chat/ui-contexts';

import { useRoom } from '../../contexts/RoomContext';

/**
 * Whether the current room shows its views as tabs above the conversation, taking the Threads button out of the
 * header.
 */
export const useRoomTabsEnabled = (): boolean => {
	const room = useRoom();
	const threadsEnabled = useSetting('Threads_enabled', false);
	const { isEmbedded } = useLayout();

	return threadsEnabled && !isEmbedded && !isOmnichannelRoom(room);
};
