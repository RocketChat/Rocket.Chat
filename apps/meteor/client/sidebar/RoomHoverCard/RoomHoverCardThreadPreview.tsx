import type { IRoom, ISubscription, IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, ButtonGroup, Icon, IconButton, Popover, Skeleton } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { MessageTypes } from '@rocket.chat/message-types';
import { useEndpoint, useSetting, useToastMessageDispatch, useUserId, useUserPreference } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { RefObject, UIEvent } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useRoomHoverCardSurface } from './RoomHoverCardSurfaceContext';
import { useMergedRefsV2 } from '../../hooks/useMergedRefsV2';
import { mapMessageFromApi } from '../../lib/utils/mapMessageFromApi';
import { useKeepAtBottom } from '../../views/room/MessageList/hooks/useKeepAtBottom';
import { isMessageNewDay } from '../../views/room/MessageList/lib/isMessageNewDay';
import MessageListProvider from '../../views/room/MessageList/providers/MessageListProvider';
import { RoomContext } from '../../views/room/contexts/RoomContext';
import { ThreadMessageItem } from '../../views/room/contextualBar/Threads/components/ThreadMessageItem';
import { useToggleFollowingThreadMutation } from '../../views/room/contextualBar/Threads/hooks/useToggleFollowingThreadMutation';
import { isThreadMessageSequential } from '../../views/room/contextualBar/Threads/lib/isThreadMessageSequential';
import { DateListProvider } from '../../views/room/providers/DateListProvider';

const LATEST_REPLIES = 4;

// As the thread view's message list: no sideways scrolling, long words wrap. Narrower than that list, so a long name
// and username give way (truncated) instead of pushing the time out of sight.
const messageListStyle = css`
	overflow: hidden auto;
	max-height: min(30rem, 60vh);
	word-wrap: break-word;

	.rcx-message-header__name-container {
		flex-shrink: 1;
		min-width: 0;
	}
`;

// The preview sits clear of the card: the card's 18px padding around the row, plus the same 12px gap the card keeps
// from the sidebar. The positioning engine takes px.
const getPopoverOffset = () => 1.875 * parseFloat(window.getComputedStyle(document.documentElement).fontSize || '16');

/**
 * The first of the latest replies the user hasn't read. Nothing records when a single thread was last read, so this is
 * the first reply posted after the user last saw the room or last replied in the thread, whichever is later; the
 * thread is unread, so its last reply is unread at least.
 */
const findFirstUnreadReply = (replies: IThreadMessage[], uid: string | undefined, lastSeen: ISubscription['ls']) => {
	const ownLastReply = Math.max(0, ...replies.filter((reply) => reply.u._id === uid).map((reply) => reply.ts.getTime()));
	const seenUntil = Math.max(lastSeen ? new Date(lastSeen).getTime() : 0, ownLastReply);

	return replies.find((reply) => reply.ts.getTime() > seenUntil) ?? replies.at(-1);
};

export type RoomHoverCardThreadPreviewProps = {
	thread: IThreadMainMessage;
	room: IRoom;
	roomName: string;
	subscription: ISubscription;
	triggerRef: RefObject<Element | null>;
	onOpenThread: (tmid: IThreadMainMessage['_id']) => void;
	onPointerEnter: () => void;
	onPointerLeave: () => void;
	onClose: () => void;
};

/**
 * A quick look at one unread thread, rendered by the thread view's own message components: its parent message and
 * latest replies, without opening it or marking it read.
 */
const RoomHoverCardThreadPreview = ({
	thread,
	room,
	roomName,
	subscription,
	triggerRef,
	onOpenThread,
	onPointerEnter,
	onPointerLeave,
	onClose,
}: RoomHoverCardThreadPreviewProps) => {
	const { t } = useTranslation();
	const titleId = useId();
	const uid = useUserId();
	const surfaceRef = useRoomHoverCardSurface();
	const dispatchToastMessage = useToastMessageDispatch();
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const groupingPeriod = useSetting('Message_GroupingPeriod', 300);

	const getThreadMessages = useEndpoint('GET', '/v1/chat.getThreadMessages');
	const { data: replies } = useQuery({
		queryKey: ['sidebar', 'room-hover-card', thread.rid, 'thread-preview', thread._id, thread.tlm?.toISOString()],
		queryFn: async () => {
			const { messages } = await getThreadMessages({ tmid: thread._id, count: LATEST_REPLIES, sort: JSON.stringify({ ts: -1 }) });
			return messages
				.map((message) => mapMessageFromApi(message))
				.filter(isThreadMessage)
				.reverse();
		},
	});

	const readThread = useEndpoint('POST', '/v1/chat.readThread');
	const markAsRead = useStableCallback(async () => {
		try {
			await readThread({ tmid: thread._id });
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const [following, setFollowing] = useState(() => Boolean(uid && thread.replies?.includes(uid)));
	const toggleFollowing = useToggleFollowingThreadMutation({
		onSuccess: (_data, { follow }) => setFollowing(follow),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	// Like the thread view, the list opens on its latest replies and stays there as it grows (avatars, attachments
	// loading), until the user scrolls up.
	const isAtBottom = useRef<boolean | null>(true);
	const listRef = useRef<HTMLDivElement | null>(null);
	const { keepAtBottomRef, setKeepAtBottom } = useKeepAtBottom(isAtBottom);
	const mergedListRef = useMergedRefsV2(listRef, keepAtBottomRef);

	useEffect(() => {
		setKeepAtBottom(() => {
			if (listRef.current) {
				listRef.current.scrollTop = listRef.current.scrollHeight;
			}
		});
	}, [setKeepAtBottom]);

	const handleListScroll = (e: UIEvent<HTMLDivElement>) => {
		const { scrollHeight, scrollTop, clientHeight } = e.currentTarget;
		isAtBottom.current = scrollHeight - scrollTop - clientHeight < 2;
	};

	// The thread view's components read the room they're in.
	const roomContext = useMemo(
		() => ({ rid: room._id, room, subscription, hasMorePreviousMessages: false, hasMoreNextMessages: false, isLoadingMoreMessages: false }),
		[room, subscription],
	);

	const replyCount = thread.tcount ?? 0;
	const earlierReplies = replies ? replyCount - replies.length : 0;
	const firstUnreadReply = replies && findFirstUnreadReply(replies, uid, subscription.ls);

	const popoverState = {
		isOpen: true,
		setOpen: (open: boolean) => !open && onClose(),
		open: () => undefined,
		close: onClose,
		toggle: onClose,
	};

	return (
		<Popover isNonModal placement='end' offset={getPopoverOffset()} triggerRef={triggerRef} state={popoverState}>
			<Box
				ref={surfaceRef}
				role='dialog'
				aria-labelledby={titleId}
				onMouseEnter={onPointerEnter}
				onMouseLeave={onPointerLeave}
				width='x390'
				display='flex'
				flexDirection='column'
				overflow='hidden'
				backgroundColor='surface-light'
				borderWidth='default'
				borderColor='stroke-extra-light'
				borderRadius='medium'
				elevation='2'
			>
				<Box
					display='flex'
					alignItems='center'
					paddingInlineStart={16}
					paddingInlineEnd={14}
					paddingBlock={12}
					borderBlockEndWidth='default'
					borderBlockEndColor='stroke-extra-light'
				>
					<Icon name='thread' size='x16' color='font-default' />
					<Box id={titleId} fontScale='p2b' color='font-default' marginInlineStart={8} flexShrink={0}>
						{t('Thread')}
					</Box>
					<Box fontScale='c1' color='font-hint' marginInlineStart={8} flexGrow={1} withTruncatedText>
						{t('Thread_preview_context', { roomName, count: replyCount })}
					</Box>
					<IconButton
						small
						icon='new-window'
						title={t('Open_thread')}
						aria-label={t('Open_thread')}
						onClick={() => onOpenThread(thread._id)}
					/>
				</Box>
				<Box
					ref={mergedListRef}
					role='list'
					backgroundColor='surface-room'
					className={[messageListStyle, hideUsernames && 'hide-usernames']}
					onScroll={handleListScroll}
				>
					<Box paddingBlockEnd={8}>
						<RoomContext.Provider value={roomContext}>
							<MessageListProvider>
								<DateListProvider>
									<ThreadMessageItem
										message={thread}
										previous={undefined}
										sequential={false}
										shouldShowAsSequential={false}
										showUserAvatar={showUserAvatar}
										firstUnread={false}
										system={MessageTypes.isSystemMessage(thread)}
									/>
									{earlierReplies > 0 && (
										<Box role='listitem' paddingInlineStart={68} paddingInlineEnd={16} paddingBlock={6}>
											<Box
												is='button'
												type='button'
												display='flex'
												alignItems='center'
												fontScale='c2'
												color='font-info'
												onClick={() => onOpenThread(thread._id)}
											>
												<Icon name='chevron-expand' size='x16' marginInlineEnd={6} />
												{t('Earlier_replies_count', { count: earlierReplies })}
											</Box>
										</Box>
									)}
									{!replies &&
										Array.from({ length: Math.min(replyCount, 2) }, (_, index) => (
											<Box key={index} paddingInline={16} paddingBlock={6}>
												<Skeleton variant='rect' height='x40' />
											</Box>
										))}
									{replies?.map((reply, index, { [index - 1]: previousReply }) => {
										// After the earlier replies left out, the first reply isn't grouped with the parent message.
										const previous = previousReply ?? thread;
										const sequential =
											Boolean(previousReply || earlierReplies === 0) && isThreadMessageSequential(reply, previous, groupingPeriod);
										const firstUnread = reply._id === firstUnreadReply?._id;

										return (
											<ThreadMessageItem
												key={reply._id}
												message={reply}
												previous={previous}
												sequential={sequential}
												shouldShowAsSequential={sequential && !isMessageNewDay(reply, previous)}
												showUserAvatar={showUserAvatar}
												firstUnread={firstUnread}
												system={MessageTypes.isSystemMessage(reply)}
											/>
										);
									})}
								</DateListProvider>
							</MessageListProvider>
						</RoomContext.Provider>
					</Box>
				</Box>
				<Box
					display='flex'
					alignItems='center'
					backgroundColor='surface-tint'
					paddingInline={16}
					paddingBlockStart={10}
					paddingBlockEnd={14}
					borderBlockStartWidth='default'
					borderBlockStartColor='stroke-extra-light'
				>
					<ButtonGroup>
						<Button small primary icon='thread' onClick={() => onOpenThread(thread._id)}>
							{t('Reply_in_thread')}
						</Button>
						<Button small secondary icon='check' onClick={markAsRead}>
							{t('Mark_as_read')}
						</Button>
					</ButtonGroup>
					<Box flexGrow={1} />
					<IconButton
						small
						icon={following ? 'bell-off' : 'bell'}
						title={t(following ? 'Unfollow_message' : 'Follow_message')}
						aria-label={t(following ? 'Unfollow_message' : 'Follow_message')}
						disabled={toggleFollowing.isPending}
						onClick={() => toggleFollowing.mutate({ rid: thread.rid, tmid: thread._id, follow: !following })}
					/>
				</Box>
			</Box>
		</Popover>
	);
};

export default RoomHoverCardThreadPreview;
