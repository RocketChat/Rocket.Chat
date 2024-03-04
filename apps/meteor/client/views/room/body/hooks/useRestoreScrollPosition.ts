import type { IRoom } from '@rocket.chat/core-typings';
import { useCallback, useEffect } from 'react';

import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import type { MessageListContextValue } from '../../../../components/message/list/MessageListContext';
import { RoomManager } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition(
	rid: IRoom['_id'],
	scrollMessageList: Exclude<MessageListContextValue['scrollMessageList'], undefined>,
	sendToBottom: () => void,
	ref: React.MutableRefObject<boolean>,
) {
	useEffect(() => {
		const store = RoomManager.getStore(rid);

		if (store?.scroll && !store.atBottom) {
			scrollMessageList(() => {
				return { left: 30, top: store.scroll };
			});
		} else {
			sendToBottom();
		}
	}, [rid, scrollMessageList, sendToBottom]);

	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}

			const store = RoomManager.getStore(rid);

			const handleWrapperScroll = withThrottling({ wait: 30 })(() => {
				store?.update({ scroll: node.scrollTop, atBottom: ref.current });
			});

			const afterMessageGroup = (): void => {
				if (store?.scroll && !store.atBottom) {
					node.scrollTop = store.scroll;
				} else {
					sendToBottom();
				}
				node.removeEventListener('MessageGroup', afterMessageGroup);
			};

			node.addEventListener('scroll', handleWrapperScroll, { passive: true });

			node.addEventListener('MessageGroup', afterMessageGroup);
		},
		[ref, rid, sendToBottom],
	);

	return { ref: callbackRef, isAtBottom: ref };
}
