import type { IRoom } from '@rocket.chat/core-typings';
import { useEffect } from 'react';

import type { MessageListContextValue } from '../../../../components/message/list/MessageListContext';
import { RoomManager } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition(
	roomId: IRoom['_id'],
	scrollMessageList: Exclude<MessageListContextValue['scrollMessageList'], undefined>,
	sendToBottom: () => void,
) {
	useEffect(() => {
		const store = RoomManager.getStore(roomId);

		if (store?.scroll && !store.atBottom) {
			scrollMessageList(() => {
				return { left: 30, top: store.scroll };
			});
		} else {
			sendToBottom();
		}
	}, [roomId, scrollMessageList, sendToBottom]);
}
