import type { IMessage } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useUser } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef } from 'react';
import { throttle } from 'underscore';

import { callbacks } from '../../../../../../lib/callbacks';
import { useSafeRefCallback } from '../../../../../hooks/useSafeRefCallback';
import { useRoom } from '../../../contexts/RoomContext';

export const useLegacyThreadMessageListScrolling = (mainMessage: IMessage) => {
	const listWrapperRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLElement>(null);

	const jumpToRef = useRef<HTMLElement>(undefined);

	const atBottomRef = useRef(true);
	const sendToBottomIfNecessaryInner = useCallback(
		throttle((listWrapper: HTMLDivElement) => {
			if (jumpToRef.current) {
				atBottomRef.current = false;
			}
			if (atBottomRef.current === true) {
				listWrapper?.scrollTo(30, listWrapper.scrollHeight);
			}
		}, 100),
		[],
	);

	const sendToBottomIfNecessary = useCallback(() => {
		if (!listWrapperRef.current) {
			return;
		}
		sendToBottomIfNecessaryInner(listWrapperRef.current);
	}, [sendToBottomIfNecessaryInner]);

	const room = useRoom();
	const user = useUser();

	useEffect(() => {
		callbacks.add(
			'streamNewMessage',
			(msg: IMessage) => {
				if (room._id !== msg.rid || isEditedMessage(msg) || msg.tmid !== mainMessage._id) {
					return;
				}

				if (!listWrapperRef.current) {
					return;
				}

				if (msg.u._id === user?._id) {
					atBottomRef.current = true;
					sendToBottomIfNecessaryInner(listWrapperRef.current);
				}
			},
			callbacks.priority.MEDIUM,
			`thread-scroll-${room._id}`,
		);

		return () => {
			callbacks.remove('streamNewMessage', `thread-scroll-${room._id}`);
		};
	}, [room._id, sendToBottomIfNecessaryInner, user?._id, mainMessage._id]);

	const listWrapperRefCallback = useSafeRefCallback(
		useCallback((node: HTMLDivElement | null) => {
			if (node === null) {
				return;
			}

			const setScrollToBottom = () => {
				const { scrollTop, scrollHeight, clientHeight } = node;
				atBottomRef.current = scrollTop >= scrollHeight - clientHeight;
			};

			node.addEventListener('scroll', setScrollToBottom);
			return () => {
				node.removeEventListener('scroll', setScrollToBottom);
			};
		}, []),
	);

	const listRefCallback = useSafeRefCallback(
		useCallback(
			(node: HTMLDivElement | null) => {
				if (node === null) {
					return;
				}

				// Create an observer instance linked to the callback function
				const mutation = new MutationObserver((mutationList) => {
					for (const mutation of mutationList) {
						if (mutation.type === 'childList') {
							sendToBottomIfNecessary();
						}
					}
				});
				mutation.observe(node, {
					childList: true,
				});

				return () => {
					mutation.disconnect();
				};
			},
			[sendToBottomIfNecessary],
		),
	);

	return {
		listWrapperRef: useMergedRefs(
			useSafeRefCallback(
				useCallback(
					(node: HTMLDivElement | null) => {
						if (node === null) {
							return;
						}

						const observer = new ResizeObserver(() => {
							sendToBottomIfNecessary();
						});
						observer.observe(node);
						return () => {
							observer.disconnect();
						};
					},
					[sendToBottomIfNecessary],
				),
			),
			listWrapperRefCallback,
			listWrapperRef,
		),
		listRef: useMergedRefs(listRefCallback, listRef),
		requestScrollToBottom: sendToBottomIfNecessary,
		jumpToRef,
	};
};
