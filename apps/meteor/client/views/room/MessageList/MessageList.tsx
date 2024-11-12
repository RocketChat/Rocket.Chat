import type { IRoom } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentProps } from 'react';
import React, { useCallback, useEffect, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { StateSnapshot } from 'react-virtuoso';

import { MessageTypes } from '../../../../app/ui-utils/client';
import { RoomManager } from '../../../lib/RoomManager';
import { useRoomSubscription } from '../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { MessageListItem } from './MessageListItem';
import { useMessages } from './hooks/useMessages';
import { isMessageSequential } from './lib/isMessageSequential';
import MessageListProvider from './providers/MessageListProvider';

type MessageListProps = {
	rid: IRoom['_id'];
	messageListRef: ComponentProps<typeof MessageListProvider>['messageListRef'];
	renderBefore: any;
	renderAfter: any;
};

export const MessageList = function MessageList({ rid, messageListRef, renderBefore, renderAfter }: MessageListProps) {
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const store = RoomManager.getStore(rid);
	const state = React.useRef<StateSnapshot | undefined>(store?.state);
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);
	const firstUnreadMessageId = useFirstUnreadMessageId();
	const virtuosoRef: any = useRef(null);

	const scrollParent: any = messageListRef?.current;

	console.log(rid);
	console.log({ scrollParent, rid });

	const initialTopMostItemIndex = !state.current ? messages.length - 1 : undefined;

	useEffect(() => {
		console.log(`MESSAGELIST MOUNT ${rid}`);

		return () => {
			console.log(`MESSAGE LIST UNMOUNT ${rid}`);
		};
	}, []);

	const itemContent = useCallback(
		(index: number, message) => {
			const previous = messages[index - 1];
			const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
			const showUnreadDivider = firstUnreadMessageId === message._id;
			const system = MessageTypes.isSystemMessage(message);
			const visible = !isThreadMessage(message) && !system;

			return (
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
			);
		},
		[messages, messageGroupingPeriod, firstUnreadMessageId, showUserAvatar, subscription],
	);

	if (!messages?.length) {
		console.log(`NO MESSAGES`);
		console.log(messages);
		return null;
	}

	console.log({
		scrollParent,
	});

	return (
		<MessageListProvider messageListRef={messageListRef}>
			<SelectedMessagesProvider>
				<Virtuoso
					components={{
						Header: renderBefore,
						Footer: renderAfter,
					}}
					totalCount={messages?.length}
					ref={virtuosoRef}
					// customScrollParent={scrollParent}
					overscan={50}
					followOutput={(isAtBottom: any) => {
						console.log(`follow-output ${rid}`);
						if (isAtBottom) {
							return 'smooth';
						}
						return false;
					}}
					initialTopMostItemIndex={initialTopMostItemIndex}
					computeItemKey={(index) => messages[index]._id}
					data={messages}
					itemContent={itemContent}
					isScrolling={() => {
						const store = RoomManager.getStore(rid);
						virtuosoRef?.current?.getState((snapshot: any) => {
							if (snapshot) {
								store?.update({ state: snapshot });
								state.current = snapshot;
							}
						});
					}}
					atBottomStateChange={(state) => {
						console.log(`AT BOTTOM STATE CHANGE	${state}`);
					}}
					restoreStateFrom={state.current}
					atTopThreshold={0}
					atBottomThreshold={150}
					// style={{ height: '100%', width: '100%' }}
				/>
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
};
