import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { isEditedMessage } from '@rocket.chat/core-typings';
import { Box, Bubble } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { usePermission, useRole, useSetting, useTranslation, useUser, useUserPreference } from '@rocket.chat/ui-contexts';
import type { MouseEventHandler, ReactElement, UIEvent } from 'react';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { RoomRoles } from '../../../../app/models/client';
import { RoomHistoryManager } from '../../../../app/ui-utils/client';
import { isAtBottom } from '../../../../app/ui/client/views/app/lib/scrolling';
import { callbacks } from '../../../../lib/callbacks';
import { isTruthy } from '../../../../lib/isTruthy';
import { CustomScrollbars } from '../../../components/CustomScrollbars';
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import { useFormatDate } from '../../../hooks/useFormatDate';
import { useReactiveQuery } from '../../../hooks/useReactiveQuery';
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
import DropTargetOverlay from './DropTargetOverlay';
import JumpToRecentMessageButton from './JumpToRecentMessageButton';
import LeaderBar from './LeaderBar';
import LoadingMessagesIndicator from './LoadingMessagesIndicator';
import RetentionPolicyWarning from './RetentionPolicyWarning';
import RoomForeword from './RoomForeword/RoomForeword';
import UnreadMessagesIndicator from './UnreadMessagesIndicator';
import UploadProgressIndicator from './UploadProgressIndicator';
import { useFileUpload } from './hooks/useFileUpload';
import { useGetMore } from './hooks/useGetMore';
import { useGoToHomeOnRemoved } from './hooks/useGoToHomeOnRemoved';
import { useLeaderBanner } from './hooks/useLeaderBanner';
import { useListIsAtBottom } from './hooks/useListIsAtBottom';
import { useQuoteMessageByUrl } from './hooks/useQuoteMessageByUrl';
import { useReadMessageWindowEvents } from './hooks/useReadMessageWindowEvents';
import { useRestoreScrollPosition } from './hooks/useRestoreScrollPosition';
import { useRetentionPolicy } from './hooks/useRetentionPolicy';
import { useHandleUnread } from './hooks/useUnreadMessages';

const RoomBody = (): ReactElement => {
	const formatDate = useFormatDate();
	const t = useTranslation();
	const isLayoutEmbedded = useEmbeddedLayout();
	const room = useRoom();
	const user = useUser();
	const toolbox = useRoomToolbox();
	const admin = useRole('admin');
	const subscription = useRoomSubscription();

	const { callbackRef, listStyle, bubbleDate, showBubble, style: bubbleDateStyle } = useDateScroll();

	const [hasNewMessages, setHasNewMessages] = useState(false);

	const hideFlexTab = useUserPreference<boolean>('hideFlexTab') || undefined;
	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const displayAvatars = useUserPreference<boolean>('displayAvatars');

	const wrapperRef = useRef<HTMLDivElement | null>(null);

	const { atBottomRef, ref: isAtBottomCallbackRef } = useListIsAtBottom();

	const {
		ref: unreadBarRef,
		messagesBoxRef,
		handleUnreadBarJumpToButtonClick,
		handleMarkAsReadButtonClick,
		counter: [unread],
	} = useHandleUnread(room, subscription);

	const {
		uploads,
		handleUploadFiles,
		handleUploadProgressClose,
		targeDrop: [fileUploadTriggerProps, fileUploadOverlayProps],
	} = useFileUpload();

	const { hideLeaderHeader, ref: leaderBannerRefCallback, messagesBoxRef: leaderMessageBoxRef } = useLeaderBanner();

	const restorePositionRef = useRestoreScrollPosition(room._id);

	const getMoreRef = useGetMore(room._id, atBottomRef);

	useQuoteMessageByUrl();
	useGoToHomeOnRemoved(room, user?._id);
	useReadMessageWindowEvents();

	const chat = useChat();
	const { openUserCard, triggerProps } = useUserCard();

	if (!chat) {
		throw new Error('No ChatContext provided');
	}
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
		sendToBottom();
		chat.composer?.focus();
	}, [atBottomRef, chat.composer, sendToBottom]);

	const handleJumpToRecentButtonClick = useCallback(() => {
		atBottomRef.current = true;
		RoomHistoryManager.clear(room._id);
		RoomHistoryManager.getMoreIfIsEmpty(room._id);
	}, [atBottomRef, room._id]);

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

	const retentionPolicy = useRetentionPolicy(room);

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

	const handleComposerResize = useCallback((): void => {
		sendToBottomIfNecessary();
	}, [sendToBottomIfNecessary]);

	const handleNavigateToPreviousMessage = useCallback((): void => {
		chat.messageEditing.toPreviousMessage();
	}, [chat.messageEditing]);

	const handleNavigateToNextMessage = useCallback((): void => {
		chat.messageEditing.toNextMessage();
	}, [chat.messageEditing]);

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

	const { messageListRef, messageListProps } = useMessageListNavigation();

	const ref = useMergedRefs(
		callbackRef,
		wrapperRef,
		unreadBarRef,
		restorePositionRef,
		isAtBottomCallbackRef,
		getMoreRef,
		leaderBannerRefCallback,
	);

	return (
		<>
			{!isLayoutEmbedded && room.announcement && <Announcement announcement={room.announcement} announcementDetails={undefined} />}
			<Box className={['main-content-flex', listStyle]} key={room._id}>
				<section
					className={`messages-container flex-tab-main-content ${admin ? 'admin' : ''}`}
					id={`chat-window-${room._id}`}
					onClick={hideFlexTab && handleCloseFlexTab}
				>
					<div className='messages-container-wrapper'>
						<div className='messages-container-main' ref={useMergedRefs(callbackRef, leaderMessageBoxRef)} {...fileUploadTriggerProps}>
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
									count={unread}
									onJumpButtonClick={handleUnreadBarJumpToButtonClick}
									onMarkAsReadButtonClick={handleMarkAsReadButtonClick}
								/>
							)}
							<div
								ref={useMergedRefs(messagesBoxRef)}
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
