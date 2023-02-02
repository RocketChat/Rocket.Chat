import type { IMessage } from '@rocket.chat/core-typings';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import type { RefCallback } from 'react';
import { useContext, useEffect, useState, useCallback, useRef } from 'react';

import type { BlazePortalsSubscription } from '../../../../lib/portals/blazePortals';
import MessageHighlightContext from '../../MessageList/contexts/MessageHighlightContext';
import { ChatContext } from '../../contexts/ChatContext';
import { MessageContext } from '../../contexts/MessageContext';
import { useRoom } from '../../contexts/RoomContext';
import { useRoomMessageContext } from './useRoomMessageContext';

export const useLegacyMessageRef = (portalsSubscription: BlazePortalsSubscription) => {
	const messageContext = useContext(MessageContext);
	const chatContext = useContext(ChatContext);
	const messageHighlightContext = useContext(MessageHighlightContext);
	const room = useRoom();
	const roomMessageContext = useRoomMessageContext(room);

	const [reactiveMessageContext] = useState(
		() =>
			new ReactiveVar({
				...roomMessageContext,
				'messageHighlightContext.highlightMessageId': messageHighlightContext.highlightMessageId,
				messageContext,
				chatContext,
			}),
	);
	useEffect(() => {
		reactiveMessageContext.set({
			...roomMessageContext,
			'messageHighlightContext.highlightMessageId': messageHighlightContext.highlightMessageId,
			messageContext,
			chatContext,
		});
	}, [chatContext, messageContext, messageHighlightContext.highlightMessageId, reactiveMessageContext, roomMessageContext]);

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

							return {
								index,
								showRoles: true,
								shouldCollapseReplies: false,
								msg: message,
								room: reactiveMessageContext.get().room,
								subscription: reactiveMessageContext.get().subscription,
								settings: reactiveMessageContext.get().settings,
								u: reactiveMessageContext.get().u,
								actions: reactiveMessageContext.get().actions,
								chatContext: reactiveMessageContext.get().chatContext,
								messageContext: reactiveMessageContext.get().messageContext,
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
		[portalsSubscription, reactiveMessageContext],
	);
};
