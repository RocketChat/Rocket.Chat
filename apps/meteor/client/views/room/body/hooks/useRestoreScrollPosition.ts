import type { IRoom } from '@rocket.chat/core-typings';
import { useCallback, useEffect } from 'react';

import { withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { useMessageListScrollRef } from '../../../../components/message/list/MessageListContext';
import { RoomManager } from '../../../../lib/RoomManager';

export function useRestoreScrollPosition(rid: IRoom['_id'], ref: React.MutableRefObject<boolean>) {
	const scrollRef = useMessageListScrollRef();
	useEffect(() => {
		const store = RoomManager.getStore(rid);

		if (store?.scroll && !store.atBottom) {
			scrollRef.current?.scrollTo({ top: store.scroll, behavior: 'auto' });
		} else {
			scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight, behavior: 'auto' });
		}
	}, [rid, scrollRef]);

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
					scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight, behavior: 'auto' });
				}
				node.removeEventListener('MessageGroup', afterMessageGroup);
			};

			node.addEventListener('scroll', handleWrapperScroll, { passive: true });

			node.addEventListener('MessageGroup', afterMessageGroup);
		},
		[ref, rid, scrollRef],
	);

	return { ref: callbackRef, isAtBottom: ref };
}
