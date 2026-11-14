import { Box } from '@rocket.chat/fuselage';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import { useEmbeddedLayout } from '@rocket.chat/ui-client';
import { useRole, useUser, useUserPreference, useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { MessageListHandle, MessageListVisibility } from '@rocket.chat/ui-message-list';
import type { MouseEvent } from 'react';
import { memo, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import DropTargetOverlay from './DropTargetOverlay';
import MessageListErrorBoundary from './MessageListErrorBoundary';
import RoomAnnouncement from '../RoomAnnouncement';
import RoomMessageList from './RoomMessageList/RoomMessageList';
import UnreadMessagesIndicator from './UnreadMessagesIndicator';
import UploadProgressIndicator from './UploadProgress';
import { RoomHistoryManager } from '../../../lib/RoomHistoryManager';
import ComposerContainer from '../composer/ComposerContainer';
import { useElementHeight } from './hooks/useElementHeight';
import { useFileUpload } from './hooks/useFileUpload';
import { useFileUploadDropTarget } from './hooks/useFileUploadDropTarget';
import { useGoToHomeOnRemoved } from './hooks/useGoToHomeOnRemoved';
import { useQuoteMessageByUrl } from './hooks/useQuoteMessageByUrl';
import { useReadMessageWindowEvents } from './hooks/useReadMessageWindowEvents';
import { useRetryFirstPage } from './hooks/useRetryFirstPage';
import RoomBodyContent from './layout/RoomBodyContent';
import RoomComposer from '../composer/RoomComposer/RoomComposer';
import { useChat } from '../contexts/ChatContext';
import { useRoom, useRoomSubscription } from '../contexts/RoomContext';
import { useCanPreviewRoom } from '../hooks/useCanPreviewRoom';
import { useRetentionPolicy } from '../hooks/useRetentionPolicy';
import { useRoomMessages } from '../hooks/useRoomMessages';
import { useToggleSelectAll } from '../providers/SelectedMessagesContext';
import useTryToJumpToThreadMessage from './hooks/useTryToJumpToThreadMessage';
import { useHandleUnread } from './hooks/useUnreadMessages';
import { useUserScrollIntent } from './hooks/useUserScrollIntent';

const RoomBody = () => {
	const chat = useChat();
	if (!chat) {
		throw new Error('No ChatContext provided');
	}

	const { t } = useTranslation();
	const isLayoutEmbedded = useEmbeddedLayout();
	const room = useRoom();
	const user = useUser();
	const toolbox = useRoomToolbox();
	const admin = useRole('admin');
	const subscription = useRoomSubscription();

	const retentionPolicy = useRetentionPolicy(room);

	useTryToJumpToThreadMessage();

	const hideFlexTab = useUserPreference<boolean>('hideFlexTab') || undefined;

	const { hasMoreNextMessages } = useRoomMessages();

	// The floating date of the list rests below what the room draws over its top
	const [overlaysRef, overlaysHeight] = useElementHeight();

	const canPreview = useCanPreviewRoom(room, subscription);

	const {
		handleUnreadBarJumpToButtonClick,
		handleMarkAsReadButtonClick,
		counter: [unread],
		setUnreadCount,
		setLastMessageDate,
		debouncedMessageRead,
	} = useHandleUnread(room, subscription);

	const [fileUploadTriggerProps, fileUploadOverlayProps] = useFileUploadDropTarget();
	const { uploads, isUploading } = useFileUpload();

	const messageListRef = useRef<MessageListHandle>(null);
	const toggleSelectAll = useToggleSelectAll();

	const selectAllAndScrollToTop = useCallback(() => {
		messageListRef.current?.scrollToTop();
		toggleSelectAll();
	}, [toggleSelectAll]);

	// The unread count follows the top message at a calmer pace than the list reports it.
	const updateTopMessage = useDebouncedCallback(
		(topMessage: MessageListVisibility['topMessage']) => {
			if (!topMessage) {
				setUnreadCount(0);
				return;
			}
			setLastMessageDate(topMessage.ts);
		},
		300,
		[setUnreadCount, setLastMessageDate],
	);

	const handleVisibleMessagesChange = useCallback(
		({ topMessage }: MessageListVisibility) => {
			updateTopMessage(topMessage);
			debouncedMessageRead();
		},
		[updateTopMessage, debouncedMessageRead],
	);

	// The viewer's input asks for the read check, and for the first page again when it failed to load.
	const retryFirstPage = useRetryFirstPage(room._id, canPreview);
	const handleUserInput = useCallback(() => {
		debouncedMessageRead();
		retryFirstPage();
	}, [debouncedMessageRead, retryFirstPage]);
	const { ref: userScrollIntentRef, hasUserScrolled } = useUserScrollIntent(handleUserInput);

	useEffect(() => {
		chat.readStateManager.setIsUnreadMarkVisibleCallback(() => messageListRef.current?.getVisibility()?.isFirstUnreadVisible ?? false);
	}, [chat.readStateManager]);

	useEffect(() => {
		chat.readStateManager.setHasUserReachedLatestMessageCallback(
			() =>
				hasUserScrolled.current &&
				(messageListRef.current?.getVisibility()?.isAtBottom ?? false) &&
				!hasMoreNextMessages &&
				RoomHistoryManager.isLoaded(room._id),
		);
	}, [chat.readStateManager, hasUserScrolled, hasMoreNextMessages, room._id]);

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
			<RoomBodyContent key={room._id}>
				<section
					role='presentation'
					className={`messages-container flex-tab-main-content ${admin ? 'admin' : ''}`}
					id={`chat-window-${room._id}`}
					onClick={hideFlexTab && handleCloseFlexTab}
				>
					<div className='messages-container-wrapper'>
						<div className='messages-container-main' {...fileUploadTriggerProps}>
							<DropTargetOverlay {...fileUploadOverlayProps} />
							<Box ref={overlaysRef} position='absolute' width='full'>
								{isUploading && <UploadProgressIndicator uploads={uploads} />}
								{Boolean(unread) && (
									<UnreadMessagesIndicator
										count={unread}
										onJumpButtonClick={handleUnreadBarJumpToButtonClick}
										onMarkAsReadButtonClick={handleMarkAsReadButtonClick}
									/>
								)}
							</Box>
							<div ref={userScrollIntentRef} className='messages-box'>
								{!canPreview ? (
									<div className='content room-not-found error-color'>
										<div>{t('You_must_join_to_view_messages_in_this_channel')}</div>
									</div>
								) : null}
								<div className='wrapper'>
									<MessageListErrorBoundary>
										<RoomMessageList
											key={room._id}
											ref={messageListRef}
											room={room}
											subscription={subscription}
											user={user}
											canPreview={canPreview}
											retentionPolicy={retentionPolicy}
											overlayTopInset={overlaysHeight}
											onVisibleMessagesChange={handleVisibleMessagesChange}
										/>
									</MessageListErrorBoundary>
								</div>
							</div>
							<RoomComposer aria-label={t('Room_composer')}>
								<ComposerContainer
									subscription={subscription}
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
			</RoomBodyContent>
		</>
	);
};

export default memo(RoomBody);
