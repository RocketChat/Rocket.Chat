import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { Box, Bubble } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { usePermission, useRole, useRouter, useSetting, useTranslation, useUser, useUserPreference } from '@rocket.chat/ui-contexts';
import type { MouseEventHandler, ReactElement, UIEvent } from 'react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ChatMessage, RoomRoles } from '../../../../app/models/client';
import { RoomHistoryManager } from '../../../../app/ui-utils/client';
import { isAtBottom } from '../../../../app/ui/client/views/app/lib/scrolling';
import { callbacks } from '../../../../lib/callbacks';
import { isTruthy } from '../../../../lib/isTruthy';
import { withDebouncing, withThrottling } from '../../../../lib/utils/highOrderFunctions';
import { CustomScrollbars } from '../../../components/CustomScrollbars';
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { useReactiveQuery } from '../../../hooks/useReactiveQuery';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { setMessageJumpQueryStringParameter } from '../../../lib/utils/setMessageJumpQueryStringParameter';
import Announcement from '../Announcement';
import { MessageList } from '../MessageList';
import MessageListErrorBoundary from '../MessageList/MessageListErrorBoundary';
import ComposerContainer from '../composer/ComposerContainer';
import RoomComposer from '../composer/RoomComposer/RoomComposer';
import { useChat } from '../contexts/ChatContext';
import { useRoom, useRoomSubscription, useRoomMessages } from '../contexts/RoomContext';
import { useRoomToolbox } from '../contexts/RoomToolboxContext';
import { useUserCard } from '../contexts/UserCardContext';
import { useDateScroll } from '../hooks/useDateScroll';
import { useMessageListNavigation } from '../hooks/useMessageListNavigation';
import { useDateListController } from '../providers/DateListProvider';
import DropTargetOverlay from './DropTargetOverlay';
import JumpToRecentMessageButton from './JumpToRecentMessageButton';
import LeaderBar from './LeaderBar';
import LoadingMessagesIndicator from './LoadingMessagesIndicator';
import RetentionPolicyWarning from './RetentionPolicyWarning';
import RoomForeword from './RoomForeword/RoomForeword';
import UnreadMessagesIndicator from './UnreadMessagesIndicator';
import UploadProgressIndicator from './UploadProgressIndicator';
import { useFileUpload } from './hooks/useFileUpload';
import { useGoToHomeOnRemoved } from './hooks/useGoToHomeOnRemoved';
import { useLeaderBanner } from './hooks/useLeaderBanner';
import { useListIsAtBottom } from './hooks/useListIsAtBottom';
import { useQuoteMessageByUrl } from './hooks/useQuoteMessageByUrl';
import { useReadMessageWindowEvents } from './hooks/useReadMessageWindowEvents';
import { useRestoreScrollPosition } from './hooks/useRestoreScrollPosition';
import { useRetentionPolicy } from './hooks/useRetentionPolicy';
import { useUnreadMessages } from './hooks/useUnreadMessages';

const RoomBody = (): ReactElement => {
	const formatDate = useFormatDate();
	const t = useTranslation();
	const isLayoutEmbedded = useEmbeddedLayout();
	const room = useRoom();
	const user = useUser();
	const toolbox = useRoomToolbox();
	const admin = useRole('admin');
	const subscription = useRoomSubscription();

	const { list } = useDateListController();
	const { callbackRef, listStyle, bubbleDate, showBubble, style: bubbleDateStyle } = useDateScroll();

	const [lastMessageDate, setLastMessageDate] = useState<Date | undefined>();
	const [hasNewMessages, setHasNewMessages] = useState(false);

	const hideFlexTab = useUserPreference<boolean>('hideFlexTab') || undefined;
	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const displayAvatars = useUserPreference<boolean>('displayAvatars');

	const wrapperRef = useRef<HTMLDivElement | null>(null);

	const { atBottomRef, ref: isAtBottomCallbackRef } = useListIsAtBottom();

	const chat = useChat();
	const { openUserCard, triggerProps } = useUserCard();

	const { messagesBoxRef, hideLeaderHeader, ref: leaderBannerRefCallback } = useLeaderBanner();

	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	const {
		uploads,
		handleUploadFiles,
		handleUploadProgressClose,
		targeDrop: [fileUploadTriggerProps, fileUploadOverlayProps],
	} = useFileUpload();

	const _isAtBottom = useCallback((scrollThreshold = 0) => {
		const wrapper = wrapperRef.current;

		if (!wrapper) {
			return false;
		}

		if (isAtBottom(wrapper, scrollThreshold)) {
			setHasNewMessages(false);
			return true;
		}
		return false;
	}, []);

	const sendToBottom = useCallback(() => {
		wrapperRef.current?.scrollTo({ left: 30, top: wrapperRef.current?.scrollHeight });

		setHasNewMessages(false);
	}, []);

	const sendToBottomIfNecessary = useCallback(() => {
		if (atBottomRef.current === true) {
			sendToBottom();
		}
	}, [atBottomRef, sendToBottom]);

	const handleNewMessageButtonClick = useCallback(() => {
		atBottomRef.current = true;
		sendToBottomIfNecessary();
		chat.composer?.focus();
	}, [atBottomRef, chat.composer, sendToBottomIfNecessary]);

	const handleJumpToRecentButtonClick = useCallback(() => {
		atBottomRef.current = true;
		RoomHistoryManager.clear(room._id);
		RoomHistoryManager.getMoreIfIsEmpty(room._id);
	}, [atBottomRef, room._id]);

	const [unread, setUnreadCount] = useUnreadMessages(room);

	const { hasMorePreviousMessages, hasMoreNextMessages, isLoadingMoreMessages } = useRoomMessages();

	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead') as boolean | undefined;

	const canPreviewChannelRoom = usePermission('preview-c-room');

	const subscribed = !!subscription;

	const canPreview = useMemo(() => {
		if (room && room.t !== 'c') {
			return true;
		}

		if (allowAnonymousRead === true) {
			return true;
		}

		if (canPreviewChannelRoom) {
			return true;
		}

		return subscribed;
	}, [allowAnonymousRead, canPreviewChannelRoom, room, subscribed]);

	const useRealName = useSetting('UI_Use_Real_Name') as boolean;

	const { data: roomLeader } = useReactiveQuery(['rooms', room._id, 'leader', { not: user?._id }], () => {
		const leaderRoomRole = RoomRoles.findOne({
			'rid': room._id,
			'roles': 'leader',
			'u._id': { $ne: user?._id },
		});

		if (!leaderRoomRole) {
			return null;
		}

		return {
			...leaderRoomRole.u,
			name: useRealName ? leaderRoomRole.u.name || leaderRoomRole.u.username : leaderRoomRole.u.username,
		};
	});

	const handleOpenUserCard = useCallback(
		(event: UIEvent, username: IUser['username']) => {
			if (!username) {
				return;
			}

			openUserCard(event, username);
		},
		[openUserCard],
	);

	const handleUnreadBarJumpToButtonClick = useCallback(() => {
		const rid = room._id;
		const { firstUnread } = RoomHistoryManager.getRoom(rid);
		let message = firstUnread?.get();
		if (!message) {
			message = ChatMessage.findOne({ rid, ts: { $gt: unread?.since } }, { sort: { ts: 1 }, limit: 1 });
		}
		if (!message) {
			return;
		}
		setMessageJumpQueryStringParameter(message?._id);
		setUnreadCount(0);
	}, [room._id, unread?.since, setUnreadCount]);

	const handleMarkAsReadButtonClick = useCallback(() => {
		chat.readStateManager.markAsRead();
		setUnreadCount(0);
	}, [chat.readStateManager, setUnreadCount]);

	const retentionPolicy = useRetentionPolicy(room);

	useGoToHomeOnRemoved(room, user?._id);

	useEffect(() => {
		callbacks.add(
			'streamNewMessage',
			(msg: IMessage) => {
				if (room._id !== msg.rid || isEditedMessage(msg) || msg.tmid) {
					return;
				}

				if (msg.u._id === user?._id) {
					sendToBottom();
					return;
				}

				if (!_isAtBottom()) {
					setHasNewMessages(true);
				}
			},
			callbacks.priority.MEDIUM,
			room._id,
		);

		return () => {
			callbacks.remove('streamNewMessage', room._id);
		};
	}, [_isAtBottom, room._id, sendToBottom, user?._id]);

	useEffect(() => {
		const messageList = wrapperRef.current?.querySelector('ul');

		if (!messageList) {
			return;
		}

		const observer = new ResizeObserver(() => {
			sendToBottomIfNecessary();
		});

		observer.observe(messageList);

		return () => {
			observer?.disconnect();
		};
	}, [sendToBottomIfNecessary]);

	const router = useRouter();

	const debouncedReadMessageRead = useMemo(
		() =>
			withDebouncing({ wait: 500 })(() => {
				chat.readStateManager.attemptMarkAsRead();
			}),
		[chat.readStateManager],
	);

	useEffect(
		() =>
			router.subscribeToRouteChange(() => {
				const routeName = router.getRouteName();
				if (!routeName || !roomCoordinator.isRouteNameKnown(routeName)) {
					return;
				}

				debouncedReadMessageRead();
			}),
		[debouncedReadMessageRead, room._id, router, subscribed, subscription?.alert, subscription?.unread],
	);

	useEffect(() => {
		if (!subscribed) {
			setUnreadCount(0);
			return;
		}

		const count = ChatMessage.find({
			rid: room._id,
			ts: { $lte: lastMessageDate, $gt: subscription?.ls },
		}).count();

		setUnreadCount(count);
	}, [lastMessageDate, room._id, setUnreadCount, subscribed, subscription?.ls]);

	useEffect(() => {
		if (!unread?.count) {
			return debouncedReadMessageRead();
		}
	}, [debouncedReadMessageRead, room._id, unread?.count]);

	useEffect(() => {
		const wrapper = wrapperRef.current;

		if (!wrapper) {
			return;
		}

		const getElementFromPoint = (topOffset = 0): Element | undefined => {
			const messagesBox = messagesBoxRef.current;

			if (!messagesBox) {
				return;
			}

			const messagesBoxLeft = messagesBox.getBoundingClientRect().left + window.pageXOffset;
			const messagesBoxTop = messagesBox.getBoundingClientRect().top + window.pageYOffset;
			const messagesBoxWidth = parseFloat(getComputedStyle(messagesBox).width);

			let element;
			if (document.dir === 'rtl') {
				element = document.elementFromPoint(messagesBoxLeft + messagesBoxWidth - 1, messagesBoxTop + topOffset + 1);
			} else {
				element = document.elementFromPoint(messagesBoxLeft + 1, messagesBoxTop + topOffset + 1);
			}

			if (element?.classList.contains('rcx-message') || element?.classList.contains('rcx-message--sequential')) {
				return element;
			}
		};

		const updateUnreadCount = withThrottling({ wait: 300 })(() => {
			Tracker.afterFlush(() => {
				const lastInvisibleMessageOnScreen = getElementFromPoint(0) || getElementFromPoint(20) || getElementFromPoint(40);

				if (!lastInvisibleMessageOnScreen) {
					setUnreadCount(0);
					return;
				}

				const lastMessage = ChatMessage.findOne(lastInvisibleMessageOnScreen.id);
				if (!lastMessage) {
					setUnreadCount(0);
					return;
				}

				setLastMessageDate(lastMessage.ts);
			});
		});

		let lastScrollTopRef = 0;
		const handleWrapperScroll = withThrottling({ wait: 100 })((event) => {
			lastScrollTopRef = event.target.scrollTop;
			const height = event.target.clientHeight;
			const isLoading = RoomHistoryManager.isLoading(room._id);
			const hasMore = RoomHistoryManager.hasMore(room._id);
			const hasMoreNext = RoomHistoryManager.hasMoreNext(room._id);

			if ((isLoading === false && hasMore === true) || hasMoreNext === true) {
				if (hasMore === true && lastScrollTopRef <= height / 3) {
					RoomHistoryManager.getMore(room._id);
				} else if (hasMoreNext === true && Math.ceil(lastScrollTopRef) >= event.target.scrollHeight - height) {
					RoomHistoryManager.getMoreNext(room._id, atBottomRef);
				}
			}
		});

		wrapper.addEventListener('scroll', updateUnreadCount);
		wrapper.addEventListener('scroll', handleWrapperScroll);

		return () => {
			wrapper.removeEventListener('scroll', updateUnreadCount);
			wrapper.removeEventListener('scroll', handleWrapperScroll);
		};
	}, [_isAtBottom, atBottomRef, list, room._id, setUnreadCount]);

	const restoreScrollPositionRef = useRestoreScrollPosition(room._id);

	const handleComposerResize = useCallback((): void => {
		sendToBottomIfNecessary();
	}, [sendToBottomIfNecessary]);

	const handleNavigateToPreviousMessage = useCallback((): void => {
		chat.messageEditing.toPreviousMessage();
	}, [chat.messageEditing]);

	const handleNavigateToNextMessage = useCallback((): void => {
		chat.messageEditing.toNextMessage();
	}, [chat.messageEditing]);

	useEffect(() => {
		chat.uploads.wipeFailedOnes();
	}, [chat]);

	const handleCloseFlexTab: MouseEventHandler<HTMLElement> = useCallback(
		(e): void => {
			/*
			 * check if the element is a button or anchor
			 * it considers the role as well
			 * usually, the flex tab is closed when clicking outside of it
			 * but if the user clicks on a button or anchor, we don't want to close the flex tab
			 * because the user could be actually trying to open the flex tab through those elements
			 */

			const checkElement = (element: HTMLElement | null): boolean => {
				if (!element) {
					return false;
				}
				if (element instanceof HTMLButtonElement || element.getAttribute('role') === 'button') {
					return true;
				}
				if (element instanceof HTMLAnchorElement || element.getAttribute('role') === 'link') {
					return true;
				}
				return checkElement(element.parentElement);
			};

			if (checkElement(e.target as HTMLElement)) {
				return;
			}

			toolbox.closeTab();
		},
		[toolbox],
	);

	useReadMessageWindowEvents();
	useQuoteMessageByUrl();

	const { messageListRef, messageListProps } = useMessageListNavigation();

	const ref = useMergedRefs(callbackRef, wrapperRef, restoreScrollPositionRef, isAtBottomCallbackRef);

	return (
		<>
			{!isLayoutEmbedded && room.announcement && <Announcement announcement={room.announcement} announcementDetails={undefined} />}
			<Box className={['main-content-flex', listStyle]}>
				<section
					className={`messages-container flex-tab-main-content ${admin ? 'admin' : ''}`}
					id={`chat-window-${room._id}`}
					onClick={hideFlexTab && handleCloseFlexTab}
				>
					<div className='messages-container-wrapper'>
						<div className='messages-container-main' ref={useMergedRefs(callbackRef, leaderBannerRefCallback)} {...fileUploadTriggerProps}>
							<DropTargetOverlay {...fileUploadOverlayProps} />
							<div className={['container-bars', uploads.length && 'show'].filter(isTruthy).join(' ')}>
								{uploads.map((upload) => (
									<UploadProgressIndicator
										key={upload.id}
										id={upload.id}
										name={upload.name}
										percentage={upload.percentage}
										error={upload.error instanceof Error ? upload.error.message : undefined}
										onClose={handleUploadProgressClose}
									/>
								))}
							</div>
							{bubbleDate && (
								<Box className={[bubbleDateStyle, showBubble && 'bubble-visible']}>
									<Bubble small secondary>
										{formatDate(bubbleDate)}
									</Bubble>
								</Box>
							)}
							{unread && (
								<UnreadMessagesIndicator
									count={unread.count}
									onJumpButtonClick={handleUnreadBarJumpToButtonClick}
									onMarkAsReadButtonClick={handleMarkAsReadButtonClick}
								/>
							)}
							<div
								ref={messagesBoxRef}
								className={['messages-box', roomLeader && !hideLeaderHeader && 'has-leader'].filter(isTruthy).join(' ')}
							>
								<JumpToRecentMessageButton visible={hasNewMessages} onClick={handleNewMessageButtonClick} text={t('New_messages')} />
								<JumpToRecentMessageButton
									visible={hasMoreNextMessages}
									onClick={handleJumpToRecentButtonClick}
									text={t('Jump_to_recent_messages')}
								/>
								{!canPreview ? (
									<div className='content room-not-found error-color'>
										<div>{t('You_must_join_to_view_messages_in_this_channel')}</div>
									</div>
								) : null}
								{roomLeader ? (
									<LeaderBar
										_id={roomLeader._id}
										username={roomLeader.username}
										name={roomLeader.name}
										visible={!hideLeaderHeader}
										onAvatarClick={handleOpenUserCard}
										triggerProps={triggerProps}
									/>
								) : null}
								<div
									className={[
										'wrapper',
										hasMoreNextMessages && 'has-more-next',
										hideUsernames && 'hide-usernames',
										!displayAvatars && 'hide-avatar',
									]
										.filter(isTruthy)
										.join(' ')}
								>
									<MessageListErrorBoundary>
										<CustomScrollbars ref={ref}>
											<ul
												ref={messageListRef}
												className='messages-list'
												aria-live='polite'
												aria-busy={isLoadingMoreMessages}
												{...messageListProps}
											>
												{canPreview ? (
													<>
														{hasMorePreviousMessages ? (
															<li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li>
														) : (
															<li className='start color-info-font-color'>
																{retentionPolicy ? <RetentionPolicyWarning {...retentionPolicy} /> : null}
																<RoomForeword user={user} room={room} />
															</li>
														)}
													</>
												) : null}
												<MessageList rid={room._id} messageListRef={wrapperRef} />
												{hasMoreNextMessages ? (
													<li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li>
												) : null}
											</ul>
										</CustomScrollbars>
									</MessageListErrorBoundary>
								</div>
							</div>
							<RoomComposer>
								<ComposerContainer
									subscription={subscription}
									onResize={handleComposerResize}
									onNavigateToPreviousMessage={handleNavigateToPreviousMessage}
									onNavigateToNextMessage={handleNavigateToNextMessage}
									onUploadFiles={handleUploadFiles}
									// TODO: send previewUrls param
									// previewUrls={}
								/>
							</RoomComposer>
						</div>
					</div>
				</section>
			</Box>
		</>
	);
};

export default memo(RoomBody);
