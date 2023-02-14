import type { IMessage } from '@rocket.chat/core-typings';
import { isThreadMainMessage } from '@rocket.chat/core-typings';
import { ReactiveVar } from 'meteor/reactive-var';
import type { RefCallback } from 'react';
import { useEffect, useMemo, useState, useContext, useCallback, useRef } from 'react';

import type { BlazePortalsSubscription } from '../../../../../lib/portals/blazePortals';
import MessageHighlightContext from '../../../MessageList/contexts/MessageHighlightContext';
import { useRoomMessageContext } from '../../../components/body/useRoomMessageContext';
import { ChatContext } from '../../../contexts/ChatContext';
import { useRoom } from '../../../contexts/RoomContext';

export const useLegacyThreadMessageRef = (portalsSubscription: BlazePortalsSubscription) => {
	const chatContext = useContext(ChatContext);
	const messageHighlightContext = useContext(MessageHighlightContext);
	const room = useRoom();
	const roomMessageContext = useRoomMessageContext(room);
	const threadMessageContext = useMemo(
		() => ({
			...roomMessageContext,
			settings: {
				...roomMessageContext.settings,
				showReplyButton: false,
				showreply: false,
			},
		}),
		[roomMessageContext],
	);

	const [reactiveThreadMessageContext] = useState(
		() =>
			new ReactiveVar({
				...threadMessageContext,
				'messageHighlightContext.highlightMessageId': messageHighlightContext.highlightMessageId,
				chatContext,
			}),
	);
	useEffect(() => {
		reactiveThreadMessageContext.set({
			...threadMessageContext,
			'messageHighlightContext.highlightMessageId': messageHighlightContext.highlightMessageId,
			chatContext,
		});
	}, [chatContext, messageHighlightContext.highlightMessageId, reactiveThreadMessageContext, threadMessageContext]);

	const cache = useRef<Map<IMessage['_id'], { callback: RefCallback<HTMLLIElement>; reactiveMessage: ReactiveVar<IMessage> }>>(new Map());

	return useCallback(
		(message: IMessage, index: number) => {
			const pair = cache.current.get(message._id);

			if (pair) {
				pair.reactiveMessage.set(message);
				return pair.callback;
			}

			let view: Blaze.View;

			const reactiveMessage = new ReactiveVar(message);

			const callback = (node: HTMLLIElement | null) => {
				if (node?.parentElement) {
					view = Blaze.renderWithData(
						Template.message,
						() => {
							const message = reactiveMessage.get();
							const editing = message._id === reactiveThreadMessageContext.get()['messageHighlightContext.highlightMessageId'];

							return {
								index,
								msg: message,
								room: reactiveThreadMessageContext.get().room,
								subscription: reactiveThreadMessageContext.get().subscription,
								settings: reactiveThreadMessageContext.get().settings,
								u: reactiveThreadMessageContext.get().u,
								chatContext: reactiveThreadMessageContext.get().chatContext,
								hideRoles: true,
								shouldCollapseReplies: true,
								templatePrefix: 'thread-',
								...(isThreadMainMessage(message)
									? {
											customClass: ['thread-main', editing ? 'editing' : ''].filter(Boolean).join(' '),
											ignored: false,
											groupable: false,
									  }
									: {
											customClass: editing ? 'editing' : '',
											context: 'threads',
									  }),
								portalsSubscription: () => portalsSubscription,
							};
						},
						node.parentElement,
						node,
					);
				}

				if (!node) {
					Blaze.remove(view);
				}
			};

			cache.current.set(message._id, { callback, reactiveMessage });

			return callback;
		},
		[portalsSubscription, reactiveThreadMessageContext],
	);
};
