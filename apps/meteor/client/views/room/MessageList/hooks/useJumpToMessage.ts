import type { IMessage } from '@rocket.chat/core-typings';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import {
	useMessageListJumpToMessageParam,
	useMessageListRef,
	useVirtuosoRef,
} from '../../../../components/message/list/MessageListContext';
import { RoomManager } from '../../../../lib/RoomManager';
import { useRoom } from '../../contexts/RoomContext';
import { setHighlightMessage, clearHighlightMessage } from '../providers/messageHighlightSubscription';

// this is an arbitrary value so that there's a gap between the header and the message;
const SCROLL_EXTRA_OFFSET = 60;

export const useJumpToMessage = (messageId: IMessage['_id']) => {
	const jumpToMessageParam = useMessageListJumpToMessageParam();
	const listRef = useMessageListRef();
	const router = useRouter();
	const room = useRoom();
	const virtualPreview = useFeaturePreview('virtualizedRoomList');
	const virtuosoRef = useVirtuosoRef();

	const ref = useCallback(
		(node: HTMLElement | null) => {
			if (!node || !scroll) {
				return;
			}

			setTimeout(() => {
				if (virtualPreview) {
					// TODO: breaks when within a ThreadMessage until virtualization is implemented there
					const wrapper = node.parentElement;
					if (!wrapper) {
						console.log('no-wrapper');
						return;
					}

					const roomStore = RoomManager.getStore(room._id);

					if (roomStore?.lastJumpId === messageId) {
						return;
					}
					// TODO: Last scrolled to message id on that room avoid a new scroll on the same id - incomplete.
					// If the user scrolls, and, click on the link again it fails

					const index = parseInt(wrapper.getAttribute('data-index') || '0', 10);

					if (!isNaN(index)) {
						virtuosoRef?.current?.scrollToIndex({
							index,
							offset: 0,
							behavior: 'smooth',
						});
					}

					roomStore?.update({ lastJumpId: messageId });
				} else if (listRef?.current) {
					const wrapper = listRef.current;
					const containerRect = wrapper.getBoundingClientRect();
					const messageRect = node.getBoundingClientRect();

					const offset = messageRect.top - containerRect.top;
					const scrollPosition = wrapper.scrollTop;
					const newScrollPosition = scrollPosition + offset - SCROLL_EXTRA_OFFSET;

					wrapper.scrollTo({ top: newScrollPosition, behavior: 'smooth' });
				}

				const { msg: _, ...search } = router.getSearchParameters();

				router.navigate(
					{
						pathname: router.getLocationPathname(),
						search,
					},
					{ replace: false },
				);

				setHighlightMessage(messageId);
				setTimeout(clearHighlightMessage, 2000);
			}, 750);
		},
		[listRef, messageId, router],
	);

	if (jumpToMessageParam !== messageId) {
		return undefined;
	}

	return ref;
};
