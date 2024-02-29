import type { IRoom } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ForwardedRef, MutableRefObject } from 'react';
import React, { Fragment, forwardRef, useImperativeHandle, useRef } from 'react';

import { MessageTypes } from '../../../../app/ui-utils/client';
import { useRoomSubscription } from '../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { MessageListItem } from './MessageListItem';
import { useMessages } from './hooks/useMessages';
import { isMessageSequential } from './lib/isMessageSequential';
import MessageListProvider from './providers/MessageListProvider';

type MessageListProps = {
	rid: IRoom['_id'];
	scrollMessageList: ComponentProps<typeof MessageListProvider>['scrollMessageList'];
};

export const MessageList = forwardRef(function MessageList(
	{ rid, scrollMessageList }: MessageListProps,
	ref: ForwardedRef<{ [key: number]: MutableRefObject<HTMLElement> }>,
) {
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));
	const firstUnreadMessageId = useFirstUnreadMessageId();

	const internalRefs = useRef<{ [key: number]: MutableRefObject<HTMLElement> }>({});
	useImperativeHandle(ref, () => internalRefs.current, [internalRefs]);

	return (
		<MessageListProvider scrollMessageList={scrollMessageList}>
			<SelectedMessagesProvider>
				{messages.map((message, index, { [index - 1]: previous }) => {
					const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
					const showUnreadDivider = firstUnreadMessageId === message._id;
					const system = MessageTypes.isSystemMessage(message);
					const visible = !isThreadMessage(message) && !system;

					return (
						<Fragment key={message._id}>
							<MessageListItem
								message={message}
								previous={previous}
								showUnreadDivider={showUnreadDivider}
								showUserAvatar={showUserAvatar}
								sequential={sequential}
								visible={visible}
								subscription={subscription}
								system={system}
							/>
						</Fragment>
					);
				})}
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
});
