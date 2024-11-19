import { MutableRefObject, useEffect, useRef } from 'react';
import { StateSnapshot, VirtuosoHandle } from 'react-virtuoso';

const isElementInViewPort = (element: HTMLElement) => {
	const rect = element.getBoundingClientRect();
	return rect.top >= 0 && rect.bottom <= window.innerHeight;
};

const getFirstMessageElementInfo = (itemList: NodeListOf<HTMLElement>) => {
	let id = null;
	let top = 0;
	let index = 0;

	while (!id) {
		const item = itemList[index];
		const message = item.querySelector('.rcx-message') as HTMLElement | null;

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
	virtuosoRef: MutableRefObject<VirtuosoHandle | null>,
	state: StateSnapshot | undefined,
	messages: Array<{ _id: string }>,
	scrollerRef: MutableRefObject<HTMLElement | null>,
) => {
	const isPositionLockedRef = useRef<boolean>(false);
	const currentMessagesLength = useRef<number>(messages.length);

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
			const listElements = scrollerRef?.current?.querySelectorAll('.virtuoso-list > div') as NodeListOf<HTMLElement>;
			const firstItem = getFirstMessageElementInfo(listElements);
			const lockedItemIndex = messages.findIndex((message) => message._id === firstItem.id);

			virtuosoRef?.current?.scrollToIndex(lockedItemIndex);
			isPositionLockedRef.current = false;
		}
	}, [isLoadingMoreMessages, virtuosoRef, state]);

	return null;
};
