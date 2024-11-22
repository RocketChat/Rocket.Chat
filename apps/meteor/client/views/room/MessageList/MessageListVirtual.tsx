import type { IRoom } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { useRouter, useSetting, useUserPreference } from '@rocket.chat/ui-contexts';
import type { ComponentProps, MutableRefObject } from 'react';
import React, { forwardRef, useCallback, useRef, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle, StateSnapshot } from 'react-virtuoso';

import { MessageListItem } from './MessageListItem';
import { MessageTypes } from '../../../../app/ui-utils/client';
import { RoomManager } from '../../../lib/RoomManager';
import { useRoomSubscription } from '../contexts/RoomContext';
import { useFirstUnreadMessageId } from '../hooks/useFirstUnreadMessageId';
import { SelectedMessagesProvider } from '../providers/SelectedMessagesProvider';
import { useLockOnLoadMoreMessages } from './hooks/useLockLoadScroll';
import { useMessages } from './hooks/useMessages';
import { isMessageSequential } from './lib/isMessageSequential';
import MessageListProvider from './providers/MessageListProvider';

type MessageListProps = {
	rid: IRoom['_id'];
	messageListRef: ComponentProps<typeof MessageListProvider>['messageListRef'];
	renderBefore: React.ComponentType;
	renderAfter: React.ComponentType;
	isLoadingMoreMessages: boolean;
	atBottomRef: MutableRefObject<boolean>;
};

const ListComponent = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>((props, ref) => (
	<div className='virtuoso-list' {...props} ref={ref} />
));
ListComponent.displayName = 'ListComponent';

const MemoizedListComponent = React.memo(ListComponent);

// eslint-disable-next-line react/no-multi-comp
export const MessageListVirtual = forwardRef<HTMLElement, MessageListProps>(function MessageListVirtual(
	{ rid, messageListRef, renderBefore, renderAfter, isLoadingMoreMessages, atBottomRef },
	ref,
) {
	const messages = useMessages({ rid });
	const router = useRouter();
	const subscription = useRoomSubscription();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const roomStore = RoomManager.getStore(rid);
	const state = React.useRef<StateSnapshot | undefined>(roomStore?.state);
	const messageGroupingPeriod = useSetting('Message_GroupingPeriod', 300);
	const firstUnreadMessageId = useFirstUnreadMessageId();
	const virtuosoRef = useRef<VirtuosoHandle | null>(null);
	const scrollerRef = useRef<HTMLElement | null>(null);
	const jumpToMessageParam = !!router.getLocationPathname().includes('msg');

	useLockOnLoadMoreMessages(isLoadingMoreMessages, virtuosoRef, messages, scrollerRef);

	const extraProps: Record<string, any> = useMemo(() => {
		// if set initialTopMostItemIndex overrides the state
		return !state.current || jumpToMessageParam ? { initialTopMostItemIndex: messages.length - 1 } : {};
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

	const virtuosoSetter = useCallback(
		(virtuoso) => {
			virtuosoRef.current = virtuoso;
			RoomManager.getStore(rid)?.update({ virtuosoRoom: virtuoso });
		},
		[virtuosoRef, rid],
	);

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
		return null;
	}

	return (
		<MessageListProvider messageListRef={messageListRef} virtuosoRef={virtuosoRef}>
			<SelectedMessagesProvider>
				<Virtuoso
					className='virtuoso'
					components={{
						Header: renderBefore,
						Footer: renderAfter,
						List: MemoizedListComponent,
					}}
					totalCount={messages?.length}
					ref={virtuosoSetter}
					scrollerRef={refSetter}
					computeItemKey={(index) => messages[index]._id}
					increaseViewportBy={{
						top: 4000,
						bottom: 4000,
					}}
					followOutput={(isAtBottom: boolean) => {
						if (isAtBottom && !jumpToMessageParam) {
							return 'smooth';
						}
						return false;
					}}
					data={messages}
					itemContent={itemContent}
					isScrolling={() => {
						const store = RoomManager.getStore(rid);

						virtuosoRef?.current?.getState((snapshot: StateSnapshot) => {
							if (snapshot) {
								store?.update({ state: snapshot });
								state.current = snapshot;
							}
						});
					}}
					atBottomStateChange={(state) => {
						atBottomRef.current = state;
					}}
					restoreStateFrom={state.current}
					atTopThreshold={0}
					atBottomThreshold={100}
					style={{ height: '100%' }}
					{...extraProps} // there is an issue with setting initialTopMostItemIndex to null | undefined on the first render
				/>
			</SelectedMessagesProvider>
		</MessageListProvider>
	);
});
