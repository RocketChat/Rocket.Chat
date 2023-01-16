import type { RefObject } from 'react';
import { useContext, useEffect, useRef } from 'react';

import type { CommonRoomTemplateInstance } from '../../../../app/ui/client/views/app/lib/CommonRoomTemplateInstance';
import { getCommonRoomEvents } from '../../../../app/ui/client/views/app/lib/getCommonRoomEvents';
import { ChatContext } from '../contexts/ChatContext';
import { useRoom } from '../contexts/RoomContext';
import { useToolboxContext } from '../contexts/ToolboxContext';

export const useLegacyMessageEvents = ({
	messageListRef,
	onRequestScrollToBottom,
}: {
	messageListRef: RefObject<HTMLElement>;
	onRequestScrollToBottom?: () => void;
}) => {
	const room = useRoom();
	const toolbox = useToolboxContext();
	const chatContext = useContext(ChatContext);
	const onScrollRequestRef = useRef(onRequestScrollToBottom);
	onScrollRequestRef.current = onRequestScrollToBottom;

	useEffect(() => {
		const messageList = messageListRef.current;

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
				const onScrollRequest = onScrollRequestRef.current;
				onScrollRequest?.();
			},
			'rendered .js-block-wrapper'() {
				const onScrollRequest = onScrollRequestRef.current;
				onScrollRequest?.();
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
	}, [chatContext, messageListRef, room._id, toolbox]);
};
