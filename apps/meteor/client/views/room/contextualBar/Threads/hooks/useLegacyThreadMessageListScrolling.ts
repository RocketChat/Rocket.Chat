import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { useUser } from '@rocket.chat/ui-contexts';
import type { ScrollValues } from 'rc-scrollbars';
import { useCallback, useEffect, useRef } from 'react';

import { callbacks } from '../../../../../../lib/callbacks';
import { useRoom } from '../../../contexts/RoomContext';

export const useLegacyThreadMessageListScrolling = (mainMessage: IMessage) => {
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

	const room = useRoom();
	const user = useUser();

	useEffect(() => {
		callbacks.add(
			'streamNewMessage',
			(msg: IMessage) => {
				if (room._id !== msg.rid || isEditedMessage(msg) || msg.tmid !== mainMessage._id) {
					return;
				}

				if (msg.u._id === user?._id) {
					atBottomRef.current = true;
					sendToBottomIfNecessary();
				}
			},
			callbacks.priority.MEDIUM,
			`thread-scroll-${room._id}`,
		);

		return () => {
			callbacks.remove('streamNewMessage', `thread-scroll-${room._id}`);
		};
	}, [room._id, sendToBottomIfNecessary, user?._id, mainMessage._id]);

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
