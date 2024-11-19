import { useEffect, useRef } from 'react';

const isElementInViewPort = (element: any) => {
	const rect = element.getBoundingClientRect();
	return rect.top >= 0 && rect.bottom <= window.innerHeight;
};

const getFirstMessageElementInfo = (itemList: any) => {
	let id = null;
	let top = 0;
	let index = 0;

	while (!id) {
		const item = itemList[index];
		const message = item.querySelector('.rcx-message');

		if (!message || !isElementInViewPort(message)) {
			continue;
		}

		id = message?.getAttribute('id');
		if (id) {
			const bounds = message.getBoundingClientRect();
			top = bounds.top;
			break;
		}
		index++;
		if (index > itemList.length) {
			break;
		}
	}

	return {
		id,
		top,
	};
};

export const useLockOnLoadMoreMessages = (
	isLoadingMoreMessages: boolean,
	virtuosoRef: any,
	state: any,
	messages: any,
	scrollerRef: any,
) => {
	const isPositionLockedRef: any = useRef(false);
	const currentMessagesLength: any = useRef(messages.length);

	useEffect(() => {
		if (isLoadingMoreMessages) {
			if (!virtuosoRef?.current || isPositionLockedRef?.current === true || currentMessagesLength.current === messages.length) {
				return;
			}

			currentMessagesLength.current = messages.length;
			isPositionLockedRef.current = true;
			return;
		}

		if (isPositionLockedRef?.current === true) {
			const listElements = scrollerRef.current.querySelectorAll('.virtuoso-list > div');

			const firstItem = getFirstMessageElementInfo(listElements);

			const lockedItemIndex = messages.findIndex((message: any) => message._id === firstItem.id);

			virtuosoRef.current.scrollToIndex(lockedItemIndex);

			isPositionLockedRef.current = false;
		}
	}, [isLoadingMoreMessages, virtuosoRef, state]);

	return null;
};
