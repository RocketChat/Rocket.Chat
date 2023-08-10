import { useCallback, useState, useRef } from 'react';

import { useScrollMessageList } from '../../hooks/useScrollMessageList';

export const useSendToBottom = () => {
	const [hasNewMessages, setHasNewMessages] = useState(false);
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const atBottomRef = useRef(true);

	const scrollMessageList = useScrollMessageList(wrapperRef);

	const sendToBottom = useCallback(() => {
		scrollMessageList((wrapper) => {
			return { left: 30, top: wrapper?.scrollHeight };
		});

		setHasNewMessages(false);
	}, [scrollMessageList]);

	const sendToBottomIfNecessary = useCallback(() => {
		if (atBottomRef.current === true) {
			sendToBottom();
		}
	}, [sendToBottom]);

	return { hasNewMessages, setHasNewMessages, scrollMessageList, sendToBottom, sendToBottomIfNecessary, wrapperRef, atBottomRef };
};
