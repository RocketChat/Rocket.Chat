import { Box } from '@rocket.chat/fuselage';
import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { usePermission, useRole, useSetting, useTranslation, useUser, useUserPreference } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactElement } from 'react';
import { memo, useCallback, useMemo } from 'react';

import { isTruthy } from '../../../../lib/isTruthy';
import { CustomScrollbars } from '../../../components/CustomScrollbars';
import { useEmbeddedLayout } from '../../../hooks/useEmbeddedLayout';
import { BubbleDate } from '../BubbleDate';
import { MessageList } from '../MessageList';
import DropTargetOverlay from './DropTargetOverlay';
import JumpToRecentMessageButton from './JumpToRecentMessageButton';
import LoadingMessagesIndicator from './LoadingMessagesIndicator';
import RetentionPolicyWarning from './RetentionPolicyWarning';
import MessageListErrorBoundary from '../MessageList/MessageListErrorBoundary';
import RoomAnnouncement from '../RoomAnnouncement';
import ComposerContainer from '../composer/ComposerContainer';
import { useQuoteMessageByUrl } from './hooks/useQuoteMessageByUrl';
import { useReadMessageWindowEvents } from './hooks/useReadMessageWindowEvents';
import RoomComposer from '../composer/RoomComposer/RoomComposer';
import { useChat } from '../contexts/ChatContext';
import { useRoom, useRoomSubscription, useRoomMessages } from '../contexts/RoomContext';
import { useRoomToolbox } from '../contexts/RoomToolboxContext';
import { useDateScroll } from '../hooks/useDateScroll';
import { useMessageListNavigation } from '../hooks/useMessageListNavigation';
import { useRetentionPolicy } from '../hooks/useRetentionPolicy';
import RoomForeword from './RoomForeword/RoomForeword';
import UnreadMessagesIndicator from './UnreadMessagesIndicator';
import { UploadProgressContainer, UploadProgressIndicator } from './UploadProgress';
import { useFileUpload } from './hooks/useFileUpload';
import { useGetMore } from './hooks/useGetMore';
import { useGoToHomeOnRemoved } from './hooks/useGoToHomeOnRemoved';
import { useHasNewMessages } from './hooks/useHasNewMessages';
import { useListIsAtBottom } from './hooks/useListIsAtBottom';
import { useRestoreScrollPosition } from './hooks/useRestoreScrollPosition';
import { useSelectAllAndScrollToTop } from './hooks/useSelectAllAndScrollToTop';
import { useHandleUnread } from './hooks/useUnreadMessages';

const RoomBody = (): ReactElement => {
	const chat = useChat();
	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	const t = useTranslation();
	const isLayoutEmbedded = useEmbeddedLayout();
	const room = useRoom();
	const user = useUser();
	const toolbox = useRoomToolbox();
	const admin = useRole('admin');
	const subscription = useRoomSubscription();

	const retentionPolicy = useRetentionPolicy(room);

	const hideFlexTab = useUserPreference<boolean>('hideFlexTab') || undefined;
	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const displayAvatars = useUserPreference<boolean>('displayAvatars');

	const { hasMorePreviousMessages, hasMoreNextMessages, isLoadingMoreMessages } = useRoomMessages();

	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead', false);

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

	const {
		wrapperRef,
		innerRef: unreadBarInnerRef,
		handleUnreadBarJumpToButtonClick,
		handleMarkAsReadButtonClick,
		counter: [unread],
	} = useHandleUnread(room, subscription);

	const { innerRef: dateScrollInnerRef, bubbleRef, listStyle, ...bubbleDate } = useDateScroll();

	const { innerRef: isAtBottomInnerRef, atBottomRef, sendToBottom, sendToBottomIfNecessary, isAtBottom, jumpToRef } = useListIsAtBottom();

	const { innerRef: getMoreInnerRef } = useGetMore(room._id, atBottomRef);

	const {
		uploads,
		handleUploadFiles,
		handleUploadProgressClose,
		targeDrop: [fileUploadTriggerProps, fileUploadOverlayProps],
	} = useFileUpload();

	const { innerRef: restoreScrollPositionInnerRef } = useRestoreScrollPosition();

	const { messageListRef } = useMessageListNavigation();
	const { innerRef: selectAndScrollRef, selectAllAndScrollToTop } = useSelectAllAndScrollToTop();

	const { handleNewMessageButtonClick, handleJumpToRecentButtonClick, handleComposerResize, hasNewMessages, newMessagesScrollRef } =
		useHasNewMessages(room._id, user?._id, atBottomRef, {
			sendToBottom,
			sendToBottomIfNecessary,
			isAtBottom,
		});

	const innerRef = useMergedRefs(
		dateScrollInnerRef,
		restoreScrollPositionInnerRef,
		isAtBottomInnerRef,
		newMessagesScrollRef,
		unreadBarInnerRef,
		getMoreInnerRef,
		selectAndScrollRef,
		messageListRef,
	);

	const handleNavigateToPreviousMessage = useCallback((): void => {
		chat.messageEditing.toPreviousMessage();
	}, [chat.messageEditing]);

	const handleNavigateToNextMessage = useCallback((): void => {
		chat.messageEditing.toNextMessage();
	}, [chat.messageEditing]);

	const handleCloseFlexTab = useCallback(
		(e: MouseEvent<HTMLElement>): void => {
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

	useGoToHomeOnRemoved(room, user?._id);
	useReadMessageWindowEvents();
	useQuoteMessageByUrl();

	return (
		<>
			{!isLayoutEmbedded && room.announcement && <RoomAnnouncement announcement={room.announcement} />}
			<Box key={room._id} className={['main-content-flex', listStyle]}>
				<section
					role='presentation'
					className={`messages-container flex-tab-main-content ${admin ? 'admin' : ''}`}
					id={`chat-window-${room._id}`}
					onClick={hideFlexTab && handleCloseFlexTab}
				>
					<div className='messages-container-wrapper'>
						<div className='messages-container-main' ref={wrapperRef} {...fileUploadTriggerProps}>
							<DropTargetOverlay {...fileUploadOverlayProps} />
							<Box position='absolute' w='full'>
								{uploads.length > 0 && (
									<UploadProgressContainer>
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
									</UploadProgressContainer>
								)}
								{Boolean(unread) && (
									<UnreadMessagesIndicator
										count={unread}
										onJumpButtonClick={handleUnreadBarJumpToButtonClick}
										onMarkAsReadButtonClick={handleMarkAsReadButtonClick}
									/>
								)}

								<BubbleDate ref={bubbleRef} {...bubbleDate} />
							</Box>

							<div className={['messages-box'].filter(isTruthy).join(' ')}>
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
										<CustomScrollbars ref={innerRef}>
											<ul className='messages-list' aria-label={t('Message_list')} aria-busy={isLoadingMoreMessages}>
												{canPreview ? (
													<>
														{hasMorePreviousMessages ? (
															<li className='load-more'>{isLoadingMoreMessages ? <LoadingMessagesIndicator /> : null}</li>
														) : (
															<li>
																<RoomForeword user={user} room={room} />
																{retentionPolicy?.isActive ? <RetentionPolicyWarning room={room} /> : null}
															</li>
														)}
													</>
												) : null}
												<MessageList rid={room._id} messageListRef={jumpToRef} />
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
									onClickSelectAll={selectAllAndScrollToTop}
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
