import { IMessage, isEditedMessage, isOmnichannelRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import {
	useCurrentRoute,
	usePermission,
	useQueryStringParameter,
	useRole,
	useSession,
	useSetting,
	useTranslation,
	useUser,
	useUserPreference,
} from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement, UIEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Subscriptions, ChatMessage, RoomRoles, Users } from '../../../../../app/models/client';
import { readMessage, RoomHistoryManager } from '../../../../../app/ui-utils/client';
import { openUserCard } from '../../../../../app/ui/client/lib/UserCard';
import { Uploading } from '../../../../../app/ui/client/lib/fileUpload';
import { CommonRoomTemplateInstance } from '../../../../../app/ui/client/views/app/lib/CommonRoomTemplateInstance';
import { getCommonRoomEvents } from '../../../../../app/ui/client/views/app/lib/getCommonRoomEvents';
import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { callbacks } from '../../../../../lib/callbacks';
import { isTruthy } from '../../../../../lib/isTruthy';
import { withDebouncing, withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { useEmbeddedLayout } from '../../../../hooks/useEmbeddedLayout';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { RoomManager as NewRoomManager } from '../../../../lib/RoomManager';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import Announcement from '../../Announcement';
import { MessageList } from '../../MessageList/MessageList';
import { useRoom } from '../../contexts/RoomContext';
import { useTabBarAPI } from '../../providers/ToolboxProvider';
import ComposerContainer from './ComposerContainer';
import DropTargetOverlay from './DropTargetOverlay';
import JumpToRecentMessagesBar from './JumpToRecentMessagesBar';
import LeaderBar from './LeaderBar';
import LegacyMessageTemplateList from './LegacyMessageTemplateList';
import LoadingMessagesIndicator from './LoadingMessagesIndicator';
import NewMessagesButton from './NewMessagesButton';
import RetentionPolicyWarning from './RetentionPolicyWarning';
import RoomForeword from './RoomForeword';
import UnreadMessagesIndicator from './UnreadMessagesIndicator';
import UploadProgressIndicator from './UploadProgressIndicator';
import { useChatMessages } from './useChatMessages';
import { useFileUploadDropTarget } from './useFileUploadDropTarget';
import { useRetentionPolicy } from './useRetentionPolicy';
import { useRoomRoles } from './useRoomRoles';
import { useUnreadMessages } from './useUnreadMessages';

const RoomBody = (): ReactElement => {
	const t = useTranslation();
	const isLayoutEmbedded = useEmbeddedLayout();
	const room = useRoom();
	const user = useUser();
	const tabBar = useTabBarAPI();
	const admin = useRole('admin');
	const subscription = useReactiveValue(
		useCallback(() => Subscriptions.findOne({ rid: room._id }) as ISubscription | undefined, [room._id]),
	);

	const [lastMessage, setLastMessage] = useState<Date | undefined>();
	const [hideLeaderHeader, setHideLeaderHeader] = useState(false);
	const [hasNewMessages, setHasNewMessages] = useState(false);

	const hideFlexTab = useUserPreference<boolean>('hideFlexTab');
	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const displayAvatars = useUserPreference<boolean>('displayAvatars');
	const useLegacyMessageTemplate = useUserPreference<boolean>('useLegacyMessageTemplate');
	const viewMode = useUserPreference<number>('messageViewMode');

	const wrapperRef = useRef<HTMLDivElement | null>(null);
	const messagesBoxRef = useRef<HTMLDivElement | null>(null);
	const atBottomRef = useRef(!useQueryStringParameter('msg'));
	const lastScrollTopRef = useRef(0);

	const chatMessagesInstance = useChatMessages(room._id, wrapperRef);
	useRoomRoles(room._id);
	const [fileUploadTriggerProps, fileUploadOverlayProps] = useFileUploadDropTarget(room);

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
		const wrapper = wrapperRef.current;

		wrapper?.scrollTo(30, wrapper.scrollHeight);
		setHasNewMessages(false);
	}, []);

	const sendToBottomIfNecessary = useCallback(() => {
		if (atBottomRef.current === true) {
			sendToBottom();
		}
	}, [sendToBottom]);

	const checkIfScrollIsAtBottom = useCallback(() => {
		atBottomRef.current = _isAtBottom(100);
	}, [_isAtBottom]);

	const handleNewMessageButtonClick = useCallback(() => {
		atBottomRef.current = true;
		sendToBottomIfNecessary();
		chatMessagesInstance.input?.focus();
	}, [chatMessagesInstance, sendToBottomIfNecessary]);

	const handleJumpToRecentButtonClick = useCallback(() => {
		atBottomRef.current = true;
		RoomHistoryManager.clear(room._id);
		RoomHistoryManager.getMoreIfIsEmpty(room._id);
	}, [room._id]);

	const [unread, setUnreadCount] = useUnreadMessages(room);

	const uploading = useSession('uploading') as Uploading[];

	const messageViewMode = useMemo(() => {
		const modes = ['', 'cozy', 'compact'] as const;
		return modes[viewMode ?? 0] ?? modes[0];
	}, [viewMode]);

	const hasMore = useReactiveValue(useCallback(() => RoomHistoryManager.hasMore(room._id), [room._id]));

	const hasMoreNext = useReactiveValue(useCallback(() => RoomHistoryManager.hasMoreNext(room._id), [room._id]));

	const isLoading = useReactiveValue(useCallback(() => RoomHistoryManager.isLoading(room._id), [room._id]));

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

	const roomRoles = useReactiveValue<ISubscription | undefined>(
		useCallback(
			() =>
				RoomRoles.findOne({
					'rid': room._id,
					'roles': 'leader',
					'u._id': { $ne: user?._id },
				}),
			[room._id, user?._id],
		),
	);

	const useRealName = useSetting('UI_Use_Real_Name') as boolean;

	const roomLeader = useReactiveValue(
		useCallback(() => {
			if (!roomRoles) {
				return;
			}

			const leaderUser = Users.findOne({ _id: roomRoles.u._id }, { fields: { status: 1, statusText: 1 } }) as IUser | undefined;

			return {
				...roomRoles.u,
				name: useRealName ? roomRoles.u.name || roomRoles.u.username : roomRoles.u.username,
				status: leaderUser?.status,
				statusText: leaderUser?.statusText,
			} as const;
		}, [roomRoles, useRealName]),
	);

	const handleOpenUserCardButtonClick = useCallback(
		(event: UIEvent, username: IUser['username']) => {
			openUserCard({
				username,
				rid: room._id,
				target: event.currentTarget,
				open: (event: MouseEvent) => {
					event.preventDefault();
					if (username) tabBar.openUserInfo(username);
				},
			});
		},
		[room._id, tabBar],
	);

	const handleUnreadBarJumpToButtonClick = useCallback(() => {
		const rid = room._id;
		const { firstUnread } = RoomHistoryManager.getRoom(rid) ?? {};
		let message = firstUnread?.get();
		if (!message) {
			message = ChatMessage.findOne({ rid, ts: { $gt: subscription?.ls } }, { sort: { ts: 1 }, limit: 1 });
		}
		RoomHistoryManager.getSurroundingMessages(message, atBottomRef);
	}, [room._id, subscription?.ls]);

	const handleMarkAsReadButtonClick = useCallback(() => {
		readMessage.readNow(room._id);
	}, [room._id]);

	const handleUploadProgressClose = useCallback((id: Uploading['id']) => {
		Session.set(`uploading-cancel-${id}`, true);
	}, []);

	const retentionPolicy = useRetentionPolicy(room);

	useEffect(() => {
		callbacks.add(
			'streamNewMessage',
			(msg: IMessage) => {
				if (room._id !== msg.rid || (isEditedMessage(msg) && msg.editedAt) || msg.tmid) {
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

	const [routeName] = useCurrentRoute();
	const openedRoom = useSession('openedRoom');

	useEffect(() => {
		Tracker.afterFlush(() => {
			if (room._id !== openedRoom) {
				return;
			}

			if (room && isOmnichannelRoom(room)) {
				roomCoordinator.getRoomDirectives(room.t)?.openCustomProfileTab(null, room, room.v.username);
			}
		});
	}, [openedRoom, room, room._id]);

	const debouncedReadMessageRead = useMemo(
		() =>
			withDebouncing({ wait: 500 })(() => {
				readMessage.read(room._id);
			}),
		[room._id],
	);

	useEffect(() => {
		if (!routeName || !roomCoordinator.isRouteNameKnown(routeName) || room._id !== openedRoom) {
			return;
		}

		debouncedReadMessageRead();
		if (subscribed && (subscription?.alert || subscription?.unread)) {
			readMessage.refreshUnreadMark(room._id);
		}
	}, [debouncedReadMessageRead, openedRoom, room._id, routeName, subscribed, subscription?.alert, subscription?.unread]);

	useEffect(() => {
		if (!subscribed) {
			setUnreadCount(0);
			return;
		}

		const count = ChatMessage.find({
			rid: room._id,
			ts: { $lte: lastMessage, $gt: subscription?.ls },
		}).count();

		setUnreadCount(count);
	}, [lastMessage, room._id, setUnreadCount, subscribed, subscription?.ls]);

	useEffect(() => {
		if (!unread?.count) {
			return debouncedReadMessageRead();
		}
		readMessage.refreshUnreadMark(room._id);
	}, [debouncedReadMessageRead, room._id, unread?.count]);

	useEffect(() => {
		const handleReadMessage = (): void => setUnreadCount(0);
		readMessage.on(room._id, handleReadMessage);

		return () => {
			readMessage.off(room._id, handleReadMessage);
		};
	}, [room._id, setUnreadCount]);

	useEffect(() => {
		const messageList = wrapperRef.current?.querySelector('ul');

		if (!messageList) {
			return;
		}

		const messageEvents: Record<string, (event: any, template: CommonRoomTemplateInstance) => void> = {
			...getCommonRoomEvents(),
			'click .toggle-hidden'(event: JQuery.ClickEvent) {
				const mid = event.target.dataset.message;
				if (mid) document.getElementById(mid)?.classList.toggle('message--ignored');
			},
			'load .gallery-item'() {
				sendToBottomIfNecessary();
			},
			'rendered .js-block-wrapper'() {
				sendToBottomIfNecessary();
			},
		};

		const eventHandlers = Object.entries(messageEvents).map(([key, handler]) => {
			const [, event, selector] = key.match(/^(.+?)\s(.+)$/) ?? [key, key];
			return {
				event,
				selector,
				listener: (e: JQuery.TriggeredEvent<HTMLUListElement, undefined>) => handler.call(null, e, { data: { rid: room._id, tabBar } }),
			};
		});

		for (const { event, selector, listener } of eventHandlers) {
			$(messageList).on(event, selector, listener);
		}

		return () => {
			for (const { event, selector, listener } of eventHandlers) {
				$(messageList).off(event, selector, listener);
			}
		};
	}, [room._id, sendToBottomIfNecessary, tabBar]);

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

			if (element?.classList.contains('message')) {
				return element;
			}
		};

		const updateUnreadCount = withThrottling({ wait: 300 })(() => {
			Tracker.afterFlush(() => {
				const lastInvisibleMessageOnScreen = getElementFromPoint(0) || getElementFromPoint(20) || getElementFromPoint(40);

				if (!lastInvisibleMessageOnScreen || !lastInvisibleMessageOnScreen.id) {
					setUnreadCount(0);
					return;
				}

				const lastMessage = ChatMessage.findOne(lastInvisibleMessageOnScreen.id);
				if (!lastMessage) {
					setUnreadCount(0);
					return;
				}

				setLastMessage(lastMessage.ts);
			});
		});

		const handleWrapperScroll = withThrottling({ wait: 100 })((event) => {
			const roomLeader = messagesBoxRef.current?.querySelector('.room-leader');
			if (roomLeader) {
				if (event.target.scrollTop < lastScrollTopRef.current) {
					setHideLeaderHeader(false);
				} else if (_isAtBottom(100) === false && event.target.scrollTop > parseFloat(getComputedStyle(roomLeader).height)) {
					setHideLeaderHeader(true);
				}
			}
			lastScrollTopRef.current = event.target.scrollTop;
			const height = event.target.clientHeight;
			const isLoading = RoomHistoryManager.isLoading(room._id);
			const hasMore = RoomHistoryManager.hasMore(room._id);
			const hasMoreNext = RoomHistoryManager.hasMoreNext(room._id);

			if ((isLoading === false && hasMore === true) || hasMoreNext === true) {
				if (hasMore === true && lastScrollTopRef.current <= height / 3) {
					RoomHistoryManager.getMore(room._id);
				} else if (hasMoreNext === true && Math.ceil(lastScrollTopRef.current) >= event.target.scrollHeight - height) {
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
	}, [_isAtBottom, room._id, setUnreadCount]);

	useEffect(() => {
		const wrapper = wrapperRef.current;

		if (!wrapper) {
			return;
		}

		const store = NewRoomManager.getStore(room._id);

		const handleWrapperScroll = withThrottling({ wait: 30 })(() => {
			store?.update({ scroll: wrapper.scrollTop, atBottom: isAtBottom(wrapper, 50) });
		});

		const afterMessageGroup = (): void => {
			if (store?.scroll && !store.atBottom) {
				wrapper.scrollTop = store.scroll;
			} else {
				sendToBottom();
			}
			wrapper.removeEventListener('MessageGroup', afterMessageGroup);

			wrapper.addEventListener('scroll', handleWrapperScroll);
		};

		wrapper.addEventListener('MessageGroup', afterMessageGroup);

		return () => {
			wrapper.removeEventListener('MessageGroup', afterMessageGroup);
			wrapper.removeEventListener('scroll', handleWrapperScroll);
		};
	}, [room._id, sendToBottom]);

	useEffect(() => {
		const wrapper = wrapperRef.current;

		if (!wrapper) {
			return;
		}

		const handleWheel = withThrottling({ wait: 100 })(() => {
			checkIfScrollIsAtBottom();
		});

		const handleTouchStart = (): void => {
			atBottomRef.current = false;
		};

		let timer1s: ReturnType<typeof setTimeout> | undefined;
		let timer2s: ReturnType<typeof setTimeout> | undefined;

		const handleTouchEnd = (): void => {
			checkIfScrollIsAtBottom();
			timer1s = setTimeout(() => checkIfScrollIsAtBottom(), 1000);
			timer2s = setTimeout(() => checkIfScrollIsAtBottom(), 2000);
		};

		wrapper.addEventListener('mousewheel', handleWheel);
		wrapper.addEventListener('wheel', handleWheel);
		wrapper.addEventListener('scroll', handleWheel);
		wrapper.addEventListener('touchstart', handleTouchStart);
		wrapper.addEventListener('touchend', handleTouchEnd);

		return (): void => {
			if (timer1s) clearTimeout(timer1s);
			if (timer2s) clearTimeout(timer2s);
			wrapper.removeEventListener('mousewheel', handleWheel);
			wrapper.removeEventListener('wheel', handleWheel);
			wrapper.removeEventListener('scroll', handleWheel);
			wrapper.removeEventListener('touchstart', handleTouchStart);
			wrapper.removeEventListener('touchend', handleTouchEnd);
		};
	}, [checkIfScrollIsAtBottom]);

	const handleComposerResize = useCallback((): void => {
		sendToBottomIfNecessary();
	}, [sendToBottomIfNecessary]);

	return (
		<>
			{!isLayoutEmbedded && room.announcement && <Announcement announcement={room.announcement} announcementDetails={undefined} />}
			<div className='main-content-flex'>
				<section
					className={`messages-container flex-tab-main-content ${admin ? 'admin' : ''}`}
					id={`chat-window-${room._id}`}
					aria-label={t('Channel')}
					onClick={hideFlexTab ? tabBar.close : undefined}
				>
					<div className='messages-container-wrapper'>
						<div className='messages-container-main' {...fileUploadTriggerProps}>
							<DropTargetOverlay {...fileUploadOverlayProps} />
							<div className={['container-bars', (unread || uploading.length) && 'show'].filter(isTruthy).join(' ')}>
								{unread ? (
									<UnreadMessagesIndicator
										count={unread.count}
										since={unread.since}
										onJumpButtonClick={handleUnreadBarJumpToButtonClick}
										onMarkAsReadButtonClick={handleMarkAsReadButtonClick}
									/>
								) : null}
								{uploading.map((upload) => (
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
							<div
								ref={messagesBoxRef}
								className={['messages-box', messageViewMode, roomLeader && 'has-leader'].filter(isTruthy).join(' ')}
							>
								<NewMessagesButton visible={hasNewMessages} onClick={handleNewMessageButtonClick} />
								<JumpToRecentMessagesBar visible={hasMoreNext} onClick={handleJumpToRecentButtonClick} />
								{!canPreview ? (
									<div className='content room-not-found error-color'>
										<div>{t('You_must_join_to_view_messages_in_this_channel')}</div>
									</div>
								) : null}
								{roomLeader ? (
									<LeaderBar
										name={roomLeader.name}
										username={roomLeader.username}
										status={roomLeader.status}
										statusText={roomLeader.statusText}
										visible={!hideLeaderHeader}
										onAvatarClick={handleOpenUserCardButtonClick}
									/>
								) : null}
								<div
									ref={wrapperRef}
									className={[
										'wrapper',
										hasMoreNext && 'has-more-next',
										hideUsernames && 'hide-usernames',
										!displayAvatars && 'hide-avatar',
									]
										.filter(isTruthy)
										.join(' ')}
								>
									<ul className='messages-list' aria-live='polite'>
										{canPreview ? (
											<>
												{hasMore ? (
													<li className='load-more'>{isLoading ? <LoadingMessagesIndicator /> : null}</li>
												) : (
													<li className='start color-info-font-color'>
														{retentionPolicy ? <RetentionPolicyWarning {...retentionPolicy} /> : null}
														<RoomForeword user={user} room={room} />
													</li>
												)}
											</>
										) : null}
										{useLegacyMessageTemplate ? <LegacyMessageTemplateList room={room} /> : <MessageList rid={room._id} />}
										{hasMoreNext ? <li className='load-more'>{isLoading ? <LoadingMessagesIndicator /> : null}</li> : null}
									</ul>
								</div>
							</div>
							<ComposerContainer
								rid={room._id}
								subscription={subscription}
								chatMessagesInstance={chatMessagesInstance}
								onResize={handleComposerResize}
							/>
						</div>
					</div>
				</section>
			</div>
		</>
	);
};

export default memo(RoomBody);
