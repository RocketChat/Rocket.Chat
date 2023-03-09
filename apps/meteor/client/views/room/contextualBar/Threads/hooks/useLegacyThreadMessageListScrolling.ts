import type { ScrollValues } from 'rc-scrollbars';
import { useCallback, useEffect, useRef } from 'react';

export const useLegacyThreadMessageListScrolling = () => {
	const listWrapperRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLElement>(null);

	const atBottomRef = useRef(true);

	const onScroll = useCallback(({ scrollHeight, scrollTop, clientHeight }: ScrollValues) => {
		atBottomRef.current = scrollTop >= scrollHeight - clientHeight;
	}, []);

	const sendToBottomIfNecessary = useCallback(() => {
		if (atBottomRef.current === true) {
			const listWrapper = listWrapperRef.current;

			listWrapper?.scrollTo(30, listWrapper.scrollHeight);
		}
	}, []);

	useEffect(() => {
		const observer = new ResizeObserver(() => {
			sendToBottomIfNecessary();
		});

		if (listWrapperRef.current) observer.observe(listWrapperRef.current);
		if (listRef.current) observer.observe(listRef.current);

		return () => {
			observer.disconnect();
		};
	}, [sendToBottomIfNecessary]);

	return { listWrapperRef, listRef, requestScrollToBottom: sendToBottomIfNecessary, onScroll };
};
