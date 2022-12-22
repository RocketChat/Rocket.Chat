import type { UIEvent } from 'react';
import { useContext, useCallback, useEffect, useRef } from 'react';

import type { CommonRoomTemplateInstance } from '../../../../../../app/ui/client/views/app/lib/CommonRoomTemplateInstance';
import { getCommonRoomEvents } from '../../../../../../app/ui/client/views/app/lib/getCommonRoomEvents';
import { ChatContext } from '../../../contexts/ChatContext';
import { useRoom } from '../../../contexts/RoomContext';
import { useToolboxContext } from '../../../contexts/ToolboxContext';

export const useLegacyThreadMessageListScrolling = () => {
	const listWrapperRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLElement>(null);

	const atBottomRef = useRef(true);

	const onScroll = useCallback(({ currentTarget: e }: UIEvent) => {
		atBottomRef.current = e.scrollTop >= e.scrollHeight - e.clientHeight;
	}, []);

	const sendToBottomIfNecessary = useCallback(() => {
		if (atBottomRef.current === true) {
			const listWrapper = listWrapperRef.current;

			listWrapper?.scrollTo(30, listWrapper.scrollHeight);
		}
	}, []);

	const toolbox = useToolboxContext();

	const room = useRoom();
	const chatContext = useContext(ChatContext);
	useEffect(() => {
		const messageList = listRef.current;

		if (!messageList) {
			return;
		}

		const messageEvents: Record<string, (event: any, template: CommonRoomTemplateInstance) => void> = {
			...getCommonRoomEvents(),
			'click .toggle-hidden'(event: JQuery.ClickEvent) {
				const mid = event.target.dataset.message;
				if (mid) document.getElementById(mid)?.classList.toggle('message--ignored');
			},
			'load .gallery-item'() {
				sendToBottomIfNecessary();
			},
			'rendered .js-block-wrapper'() {
				sendToBottomIfNecessary();
			},
		};

		const eventHandlers = Object.entries(messageEvents).map(([key, handler]) => {
			const [, event, selector] = key.match(/^(.+?)\s(.+)$/) ?? [key, key];
			return {
				event,
				selector,
				listener: (e: JQuery.TriggeredEvent<HTMLElement, undefined>) =>
					handler.call(null, e, { data: { rid: room._id, tabBar: toolbox, chatContext } }),
			};
		});

		for (const { event, selector, listener } of eventHandlers) {
			$(messageList).on(event, selector, listener);
		}

		return () => {
			for (const { event, selector, listener } of eventHandlers) {
				$(messageList).off(event, selector, listener);
			}
		};
	}, [chatContext, room._id, sendToBottomIfNecessary, toolbox]);

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

	return { listWrapperRef, listRef, onScroll };
};
