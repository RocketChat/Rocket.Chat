import type { IMessage, IRoom, MessageTypesValues } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import type { ReactElement } from 'react';
import React, { memo, useCallback, useRef } from 'react';

import { ChatMessage } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { useMessageContext } from './useMessageContext';

type LegacyMessageTemplateListProps = {
	room: IRoom;
};

const LegacyMessageTemplateList = ({ room }: LegacyMessageTemplateListProps): ReactElement => {
	const messageContext = useMessageContext(room);

	const hideSystemMessages = useSetting('Hide_System_Messages') as MessageTypesValues[];

	const messagesHistory = useReactiveValue(
		useCallback(() => {
			const settingValues = Array.isArray(room?.sysMes) ? (room.sysMes as MessageTypesValues[]) : hideSystemMessages || [];
			const hideMessagesOfType = new Set(
				settingValues.reduce(
					(array: MessageTypesValues[], value: MessageTypesValues) => [
						...array,
						...(value === 'mute_unmute' ? (['user-muted', 'user-unmuted'] as const) : ([value] as const)),
					],
					[],
				),
			);
			const query: Mongo.Query<IMessage> = {
				rid: room._id,
				_hidden: { $ne: true },
				$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
				...(hideMessagesOfType.size && { t: { $nin: Array.from(hideMessagesOfType.values()) } }),
			};

			const options = {
				sort: {
					ts: 1,
				},
			};

			return ChatMessage.find(query, options).fetch();
		}, [hideSystemMessages, room._id, room.sysMes]),
	);

	const viewsRef = useRef<Map<string, Blaze.View>>(new Map());

	const messageRef = useCallback(
		(message: IMessage, index: number) => (node: HTMLLIElement | null) => {
			if (node?.parentElement) {
				const view = Blaze.renderWithData(
					Template.message,
					() => ({
						showRoles: true,
						index,
						shouldCollapseReplies: false,
						msg: message,
						...messageContext,
					}),
					node.parentElement,
					node,
				);

				viewsRef.current.set(message._id, view);
			}

			if (!node && viewsRef.current.has(message._id)) {
				const view = viewsRef.current.get(message._id);
				if (view) {
					Blaze.remove(view);
				}
				viewsRef.current.delete(message._id);
			}
		},
		[messageContext],
	);

	return (
		<>
			{messagesHistory.map((message, index) => (
				<li key={message._id} ref={messageRef(message, index)} />
			))}
		</>
	);
};

export default memo(LegacyMessageTemplateList);
