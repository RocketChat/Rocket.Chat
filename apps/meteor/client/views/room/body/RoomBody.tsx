import { Box } from '@rocket.chat/fuselage';
import { isTruthy } from '@rocket.chat/tools';
import { CustomVirtuaScrollbars, useEmbeddedLayout } from '@rocket.chat/ui-client';
import { usePermission, useRole, useSetting, useTranslation, useUser, useUserPreference, useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactElement } from 'react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { useMergedRefsV2 } from '../../../hooks/useMergedRefsV2';
import { BubbleDate } from '../BubbleDate';
import { MessageList } from '../MessageList';
import DropTargetOverlay from './DropTargetOverlay';
import JumpToRecentMessageButton from './JumpToRecentMessageButton';
import UnreadMessagesIndicator from './UnreadMessagesIndicator';
import MessageListErrorBoundary from '../MessageList/MessageListErrorBoundary';
import RoomAnnouncement from '../RoomAnnouncement';
import UploadProgressIndicator from './UploadProgress';
import ComposerContainer from '../composer/ComposerContainer';
import { useFileUpload } from './hooks/useFileUpload';
import { useGoToHomeOnRemoved } from './hooks/useGoToHomeOnRemoved';
import { useQuoteMessageByUrl } from './hooks/useQuoteMessageByUrl';
import { useReadMessageWindowEvents } from './hooks/useReadMessageWindowEvents';
import RoomComposer from '../composer/RoomComposer/RoomComposer';
import { useChat } from '../contexts/ChatContext';
import { useRoom, useRoomSubscription, useRoomMessages } from '../contexts/RoomContext';
import { useDateScroll } from '../hooks/useDateScroll';
import { useMessageListNavigation } from '../hooks/useMessageListNavigation';
import { useRetentionPolicy } from '../hooks/useRetentionPolicy';
import { useFileUploadDropTarget } from './hooks/useFileUploadDropTarget';
import { useGetMore } from './hooks/useGetMore';
import { useHasNewMessages } from './hooks/useHasNewMessages';
import { useSelectAllAndScrollToTop } from './hooks/useSelectAllAndScrollToTop';
import { useHandleUnread } from './hooks/useUnreadMessages';
import useTryToJumpToThreadMessage from '../MessageList/hooks/useTryToJumpToThreadMessage';

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

	const [shouldJumpToBottom, setShouldJumpToBottom] = useState<boolean>(false);
	const isAtBottom = useRef<boolean>(true);
	const [isJumpingToMessage, setIsJumpingToMessage] = useState<boolean>(false);

	const retentionPolicy = useRetentionPolicy(room);

	useTryToJumpToThreadMessage();

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
		handleUnreadBarJumpToButtonClick,
		handleMarkAsReadButtonClick,
		counter: [unread],
		setUnreadCount,
		setLastMessageDate,
		debouncedMessageRead,
	} = useHandleUnread(room, subscription);

	const { handleDateScroll, bubbleRef, listStyle, ...bubbleDate } = useDateScroll();

	const { innerRef: getMoreInnerRef } = useGetMore(room._id, isJumpingToMessage);

	const [fileUploadTriggerProps, fileUploadOverlayProps] = useFileUploadDropTarget();
	const { uploads, isUploading } = useFileUpload();

	const { messageListRef } = useMessageListNavigation();
	const { innerRef: selectAndScrollRef, selectAllAndScrollToTop } = useSelectAllAndScrollToTop();

	const {
		handleNewMessageButtonClick,
		handleJumpToRecentButtonClick,
		handleComposerResize,
		hasNewMessages,
		debouncedClearNewMessagesOnScroll,
	} = useHasNewMessages(room._id, user?._id, setShouldJumpToBottom, isAtBottom);

	const innerRef = useMergedRefsV2(getMoreInnerRef, selectAndScrollRef, messageListRef);

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
						<div className='messages-container-main' {...fileUploadTriggerProps}>
							<DropTargetOverlay {...fileUploadOverlayProps} />
							<Box position='absolute' w='full'>
								{isUploading && <UploadProgressIndicator uploads={uploads} />}
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
										<CustomVirtuaScrollbars ref={innerRef} key={room._id}>
											<MessageList
												rid={room._id}
												shouldJumpToBottom={shouldJumpToBottom}
												setShouldJumpToBottom={setShouldJumpToBottom}
												isAtBottom={isAtBottom}
												isJumpingToMessage={isJumpingToMessage}
												setIsJumpingToMessage={setIsJumpingToMessage}
												canPreview={canPreview}
												hasMorePreviousMessages={hasMorePreviousMessages}
												isLoadingMoreMessages={isLoadingMoreMessages}
												user={user}
												room={room}
												retentionPolicy={retentionPolicy}
												hasMoreNextMessages={hasMoreNextMessages}
												setUnreadCount={setUnreadCount}
												setLastMessageDate={setLastMessageDate}
												debouncedClearNewMessagesOnScroll={debouncedClearNewMessagesOnScroll}
												handleDateScroll={handleDateScroll}
												debouncedMessageRead={debouncedMessageRead}
											/>
										</CustomVirtuaScrollbars>
									</MessageListErrorBoundary>
								</div>
							</div>
							<RoomComposer aria-label={t('Room_composer')}>
								<ComposerContainer
									subscription={subscription}
									onResize={handleComposerResize}
									onNavigateToPreviousMessage={handleNavigateToPreviousMessage}
									onNavigateToNextMessage={handleNavigateToNextMessage}
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
