import { useEffect, useRef } from 'react';

const getFirstMessageElementId = (itemList: any) => {
	let id = null;
	let index = 0;
	while (!id) {
		const nextItem = itemList?.[index];
		const firstChild = nextItem?.firstElementChild;
		id = firstChild?.getAttribute('id');
		if (id) {
			break;
		}
		index++;
		if (index > itemList.length) {
			return null;
		}
	}

	return id;
};

export const useLockOnLoadMoreMessages = (
	isLoadingMoreMessages: boolean,
	virtuosoRef: any,
	state: any,
	messages: any,
	scrollerRef: any,
) => {
	const currentItemIdRef: any = useRef(null);
	const isPositionLockedRef: any = useRef(false);
	const currentMessagesLength: any = useRef(messages.length);

	useEffect(() => {
		if (isLoadingMoreMessages) {
			if (!virtuosoRef?.current || isPositionLockedRef?.current === true) {
				return;
			}

			if (currentMessagesLength.current === messages.length) {
				return;
			}

			currentMessagesLength.current = messages.length;
			const listElement = scrollerRef.current.querySelector('.virtuoso-list');
			currentItemIdRef.current = getFirstMessageElementId(listElement.children);

			isPositionLockedRef.current = true;
			return;
		}

		if (isPositionLockedRef?.current === true) {
			console.log({ messages, id: currentItemIdRef.current });
			const lockedItemIndex = messages.findIndex((message: any) => message._id === currentItemIdRef.current);

			console.log(lockedItemIndex);

			virtuosoRef.current.scrollToIndex(lockedItemIndex);

			isPositionLockedRef.current = false;
		}
	}, [isLoadingMoreMessages, virtuosoRef, state]);

	return null;
};
