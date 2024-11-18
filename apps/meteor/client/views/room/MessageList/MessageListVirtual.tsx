import type { IRoom } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MutableRefObject } from 'react';
import React, { forwardRef, useCallback, useRef, useEffect, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { StateSnapshot } from 'react-virtuoso';

import { MessageTypes } from '../../../../app/ui-utils/client';
import { RoomManager } from '../../../lib/RoomManager';
import { useRoomSubscription } from '../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { MessageListItemVirtual } from './MessageListItemVirtual';
import { useLockOnLoadMoreMessages } from './hooks/useLockLoadScroll';
import { useMessages } from './hooks/useMessages';
import { isMessageSequential } from './lib/isMessageSequential';
import MessageListProvider from './providers/MessageListProvider';

type MessageListProps = {
	rid: IRoom['_id'];
	messageListRef: ComponentProps<typeof MessageListProvider>['messageListRef'];
	renderBefore: any;
	renderAfter: any;
	isLoadingMoreMessages: boolean;
};

// also memoize this component
const ListComponent = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>((props, ref) => (
	<div className='virtuoso-list' {...props} ref={ref} />
));
ListComponent.displayName = 'ListComponent';

const MemoizedListComponent = React.memo(ListComponent);

// eslint-disable-next-line react/no-multi-comp
export const MessageListVirtual = forwardRef<HTMLElement, MessageListProps>(function MessageListVirtual(
	{ rid, messageListRef, renderBefore, renderAfter, isLoadingMoreMessages },
	ref,
) {
	const messages = useMessages({ rid });
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const store = RoomManager.getStore(rid);
	const state = React.useRef<StateSnapshot | undefined>(store?.state);
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);
	const firstUnreadMessageId = useFirstUnreadMessageId();
	const virtuosoRef: any = useRef(null);
	const isAtBottomRef: any = useRef(true);
	const scrollerRef: any = useRef(null);

	useLockOnLoadMoreMessages(isLoadingMoreMessages, virtuosoRef, state, messages, scrollerRef);

	useEffect(() => {
		console.log('MessageList useEffect');
	}, [messages]);

	const extraProps: any = useMemo(() => {
		return !state.current ? { initialTopMostItemIndex: messages.length - 1 } : {};
	}, [messages.length]);

	const refSetter = useCallback(
		(element) => {
			scrollerRef.current = element;

			if (ref && element) {
				if (typeof ref === 'function') {
					ref(element ?? null);
					return;
				}

				(ref as MutableRefObject<HTMLElement | undefined>).current = element;
			}
		},
		[ref],
	);

	const itemContent = useCallback(
		(index: number, message) => {
			const previous = messages[index - 1];
			const sequential = isMessageSequential(message, previous, messageGroupingPeriod);
			const showUnreadDivider = firstUnreadMessageId === message._id;
			const system = MessageTypes.isSystemMessage(message);
			const visible = !isThreadMessage(message) && !system;

			return (
				<MessageListItemVirtual
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
		return null;
	}

	return (
		<MessageListProvider messageListRef={messageListRef}>
			<SelectedMessagesProvider>
				<Virtuoso
					className='virtuoso'
					components={{
						Header: renderBefore,
						Footer: renderAfter,
						// eslint-disable-next-line react/display-name, react/no-multi-comp
						List: MemoizedListComponent,
					}}
					totalCount={messages?.length}
					ref={virtuosoRef}
					scrollerRef={refSetter}
					computeItemKey={(index) => messages[index]._id}
					increaseViewportBy={{
						top: 10000,
						bottom: 10000,
					}}
					followOutput={(isAtBottom: boolean) => {
						if (isAtBottom) {
							return 'smooth';
						}
						return false;
					}}
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
					// totalListHeightChanged={(value) => {
					// 	console.log(value);
					// 	// height can change on scroll which conflicts with the bottom Main issue is the load-more strategy lock of the scroll position. It has its own method on VML, but on VC it kind of needs to be implemented by hand. I made an initial attempt using the scrollToIndex method, it works but it isn’t optimal as it can have small differences..
					// }}
					atBottomStateChange={(state) => {
						isAtBottomRef.current = state;
					}}
					restoreStateFrom={state.current}
					atTopThreshold={0}
					atBottomThreshold={100}
					style={{ height: '100%' }}
					{...extraProps} // there is an issue with setting initialTopMostItemIndex to null | undefined
				/>
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
});
