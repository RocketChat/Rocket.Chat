import { useCallback, useRef } from 'react';

import { RoomManager } from '../../../../lib/RoomManager';
import { useRoom } from '../../contexts/RoomContext';

export const useListIsAtBottom = () => {
	const room = useRoom();
	const store = RoomManager.getStore(room._id);
	const atBottomRef = useRef(true);

	const sendToBottom = useCallback(() => {
		store?.virtuosoRoom?.scrollTo({
			top: 10000,
		});
	}, []);

	const sendToBottomIfNecessary = useCallback(() => {
		if (atBottomRef.current === true) {
			sendToBottom();
		}
	}, [atBottomRef, sendToBottom]);

	const isAtBottom = useCallback(() => {
		console.log('check if it is at bottom');

		return !!atBottomRef?.current;
	}, []);

	return {
		atBottomRef,
		sendToBottom,
		sendToBottomIfNecessary,
		isAtBottom,
	};
};
