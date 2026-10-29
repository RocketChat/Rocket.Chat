import { Box } from '@rocket.chat/fuselage';
import { isTruthy } from '@rocket.chat/tools';
import type { MessageListHandle, MessageListVisibility } from '@rocket.chat/ui-client';
import { useEmbeddedLayout } from '@rocket.chat/ui-client';
import { usePermission, useRole, useSetting, useTranslation, useUser, useUserPreference, useRoomToolbox } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import DropTargetOverlay from './DropTargetOverlay';
import MessageListErrorBoundary from './MessageListErrorBoundary';
import RoomAnnouncement from '../RoomAnnouncement';
import RoomMessageList from './RoomMessageList/RoomMessageList';
import UnreadMessagesIndicator from './UnreadMessagesIndicator';
import UploadProgressIndicator from './UploadProgress';
import ComposerContainer from '../composer/ComposerContainer';
import { useToggleSelectAll } from '../providers/SelectedMessagesContext';
import { useFileUpload } from './hooks/useFileUpload';
import { useFileUploadDropTarget } from './hooks/useFileUploadDropTarget';
import { useGoToHomeOnRemoved } from './hooks/useGoToHomeOnRemoved';
import { useQuoteMessageByUrl } from './hooks/useQuoteMessageByUrl';
import { useReadMessageWindowEvents } from './hooks/useReadMessageWindowEvents';
import { useHandleUnread } from './hooks/useUnreadMessages';
import RoomComposer from '../composer/RoomComposer/RoomComposer';
import { useChat } from '../contexts/ChatContext';
import { useRoom, useRoomSubscription } from '../contexts/RoomContext';
import { useRetentionPolicy } from '../hooks/useRetentionPolicy';
import useTryToJumpToThreadMessage from './hooks/useTryToJumpToThreadMessage';

const RoomBody = () => {
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

	useTryToJumpToThreadMessage();

	const hideFlexTab = useUserPreference<boolean>('hideFlexTab') || undefined;
	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const displayAvatars = useUserPreference<boolean>('displayAvatars');

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

	const [fileUploadTriggerProps, fileUploadOverlayProps] = useFileUploadDropTarget();
	const { uploads, isUploading } = useFileUpload();

	const messageListRef = useRef<MessageListHandle>(null);
	const toggleSelectAll = useToggleSelectAll();

	const selectAllAndScrollToTop = useCallback(() => {
		messageListRef.current?.scrollToTop();
		toggleSelectAll();
	}, [toggleSelectAll]);

	const handleVisibleMessagesChange = useCallback(
		({ topMessage }: MessageListVisibility) => {
			if (!topMessage) {
				setUnreadCount(0);
			} else {
				setLastMessageDate(topMessage.ts);
			}
			debouncedMessageRead();
		},
		[setUnreadCount, setLastMessageDate, debouncedMessageRead],
	);

	useEffect(() => {
		chat.readStateManager.setIsUnreadMarkVisibleCallback(() => messageListRef.current?.getVisibility()?.isFirstUnreadVisible ?? false);
	}, [chat.readStateManager]);

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
			<Box key={room._id} className='main-content-flex'>
				<section
					role='presentation'
					className={`messages-container flex-tab-main-content ${admin ? 'admin' : ''}`}
					id={`chat-window-${room._id}`}
					onClick={hideFlexTab && handleCloseFlexTab}
				>
					<div className='messages-container-wrapper'>
						<div className='messages-container-main' {...fileUploadTriggerProps}>
							<DropTargetOverlay {...fileUploadOverlayProps} />
							<Box position='absolute' width='full'>
								{isUploading && <UploadProgressIndicator uploads={uploads} />}
								{Boolean(unread) && (
									<UnreadMessagesIndicator
										count={unread}
										onJumpButtonClick={handleUnreadBarJumpToButtonClick}
										onMarkAsReadButtonClick={handleMarkAsReadButtonClick}
									/>
								)}
							</Box>
							<div className={['messages-box'].filter(isTruthy).join(' ')}>
								{!canPreview ? (
									<div className='content room-not-found error-color'>
										<div>{t('You_must_join_to_view_messages_in_this_channel')}</div>
									</div>
								) : null}
								<div
									className={['wrapper', hideUsernames && 'hide-usernames', !displayAvatars && 'hide-avatar'].filter(isTruthy).join(' ')}
								>
									<MessageListErrorBoundary>
										<RoomMessageList
											key={room._id}
											ref={messageListRef}
											room={room}
											subscription={subscription}
											user={user}
											canPreview={canPreview}
											retentionPolicy={retentionPolicy}
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
			</Box>
		</>
	);
};

export default memo(RoomBody);
