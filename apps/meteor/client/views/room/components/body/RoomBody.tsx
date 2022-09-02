import { IMessage, isEditedMessage, isOmnichannelRoom, MessageTypesValues } from '@rocket.chat/core-typings';
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
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import React, { memo, ReactElement, UIEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Subscriptions, ChatMessage, RoomRoles, Users } from '../../../../../app/models/client';
import { ChatMessages, chatMessages } from '../../../../../app/ui';
import { readMessage, RoomHistoryManager, RoomManager } from '../../../../../app/ui-utils/client';
import { messageContext } from '../../../../../app/ui-utils/client/lib/messageContext';
import { openUserCard } from '../../../../../app/ui/client/lib/UserCard';
import { Uploading } from '../../../../../app/ui/client/lib/fileUpload';
import { RoomTemplateInstance, UnreadData } from '../../../../../app/ui/client/views/app/lib/RoomTemplateInstance';
import { getCommonRoomEvents } from '../../../../../app/ui/client/views/app/lib/getCommonRoomEvents';
import { isAtBottom } from '../../../../../app/ui/client/views/app/lib/scrolling';
import { callbacks } from '../../../../../lib/callbacks';
import { isTruthy } from '../../../../../lib/isTruthy';
import { minDate, maxDate, unique, difference } from '../../../../../lib/utils/comparisons';
import { withDebouncing, withThrottling } from '../../../../../lib/utils/highOrderFunctions';
import { useEmbeddedLayout } from '../../../../hooks/useEmbeddedLayout';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { RoomManager as NewRoomManager } from '../../../../lib/RoomManager';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { messageArgs } from '../../../../lib/utils/messageArgs';
import Announcement from '../../Announcement';
import { useRoom } from '../../contexts/RoomContext';
import { useTabBarAPI } from '../../providers/ToolboxProvider';
import ComposerContainer from './ComposerContainer';
import DropTargetOverlay from './DropTargetOverlay';
import { useFileUploadDropTarget } from './useFileUploadDropTarget';
import { useRetentionPolicy } from './useRetentionPolicy';
import { useRoomRoles } from './useRoomRoles';

const RoomBody = (): ReactElement => {
	const t = useTranslation();
	const isLayoutEmbedded = useEmbeddedLayout();
	const room = useRoom();
	const user = useUser();
	const hideFlexTab = useUserPreference('hideFlexTab');
	const tabBar = useTabBarAPI();
	const admin = useRole('admin');
	const subscription = useReactiveValue(useCallback(() => Subscriptions.findOne({ rid: room._id }), [room._id]));
	const [count, setCount] = useState(0);
	const [selectable, setSelectable] = useState(false);
	const [lastMessage, setLastMessage] = useState<Date | undefined>();
	const userDetail = useMemo(() => {
		if (room.t !== 'd') {
			return '';
		}

		if (roomCoordinator.getRoomDirectives(room.t)?.isGroupChat(room)) {
			return '';
		}

		const usernames = Array.from(new Set(room.usernames));

		return usernames.length === 1 ? usernames[0] : usernames.filter((username) => username !== user?.username)[0];
	}, [room, user?.username]);
	const [hideLeaderHeader, setHideLeaderHeader] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);

	useRoomRoles(room._id);

	const [fileUploadTriggerProps, fileUploadOverlayProps] = useFileUploadDropTarget(room);

	const selectedMessagesRef = useRef<IMessage['_id'][]>([]);
	const selectedRangeRef = useRef<IMessage['_id'][]>([]);
	const selectablePointerRef = useRef<IMessage['_id'] | undefined>();
	const atBottomRef = useRef(!useQueryStringParameter('msg'));
	const lastScrollTopRef = useRef(0);

	const selectMessages = useCallback((to) => {
		if (selectablePointerRef.current === to && selectedRangeRef.current.length > 0) {
			selectedRangeRef.current = [];
		} else {
			const message1 = ChatMessage.findOne(selectablePointerRef.current);
			const message2 = ChatMessage.findOne(to);

			if (!message1 || !message2) {
				throw new Error('Invalid message selection');
			}

			const minTs = minDate(message1.ts, message2.ts);
			const maxTs = maxDate(message1.ts, message2.ts);

			selectedRangeRef.current = ChatMessage.find({ rid: message1.rid, ts: { $gte: minTs, $lte: maxTs } }).map((message) => message._id);
		}
	}, []);

	const getSelectedMessages = useCallback(() => {
		const messages = selectedMessagesRef.current;
		let addMessages = false;
		for (const message of Array.from(selectedRangeRef.current)) {
			if (messages.includes(message)) {
				addMessages = true;
				break;
			}
		}

		if (addMessages) {
			return unique([...selectedMessagesRef.current, ...selectedRangeRef.current]).filter(isTruthy);
		}

		return difference(selectedMessagesRef.current, selectedRangeRef.current).filter(isTruthy);
	}, []);

	const messagesBoxRef = useRef<HTMLDivElement | null>(null);
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	const _isAtBottom = useCallback((scrollThreshold = 0) => {
		const wrapper = wrapperRef.current;

		if (!wrapper) {
			return false;
		}

		if (isAtBottom(wrapper, scrollThreshold)) {
			setNoNewMessage(true);
			return true;
		}
		return false;
	}, []);

	const sendToBottom = useCallback(() => {
		const wrapper = wrapperRef.current;

		wrapper?.scrollTo(30, wrapper.scrollHeight);
		setNoNewMessage(true);
	}, []);

	const sendToBottomIfNecessary = useCallback(() => {
		if (atBottomRef.current === true) {
			sendToBottom();
		}
	}, [sendToBottom]);

	const checkIfScrollIsAtBottom = useCallback(() => {
		atBottomRef.current = _isAtBottom(100);
	}, [_isAtBottom]);

	const [noNewMessage, setNoNewMessage] = useState(true);
	const chatMessagesInstance = useMemo(() => {
		const instance = chatMessages[room._id] ?? new ChatMessages();
		chatMessages[room._id] = instance;
		return instance;
	}, [room._id]);

	const handleNewMessageButtonClick = useCallback(() => {
		atBottomRef.current = true;
		sendToBottomIfNecessary();
		const input = RoomManager.openedRoom ? chatMessages[RoomManager.openedRoom].input : undefined;
		input?.focus();
	}, [sendToBottomIfNecessary]);

	const handleJumpToRecentButtonClick = useCallback(
		(event: UIEvent) => {
			event.preventDefault();
			atBottomRef.current = true;
			RoomHistoryManager.clear(room._id);
			RoomHistoryManager.getMoreIfIsEmpty(room._id);
		},
		[room._id],
	);

	const containerBarsShow = useCallback((unreadData: UnreadData, uploading: Uploading[]) => {
		const hasUnreadData = Boolean(unreadData?.count && unreadData.since);
		const isUploading = Boolean(uploading?.length);

		if (hasUnreadData || isUploading) {
			return 'show';
		}
	}, []);

	const unreadSince = useReactiveValue(useCallback(() => RoomManager.getOpenedRoomByRid(room._id)?.unreadSince.get(), [room._id]));

	const unreadData = useMemo(
		() => ({
			count,
			since: unreadSince,
		}),
		[count, unreadSince],
	);

	const uploading = useSession('uploading') as Uploading[];

	const viewMode = useUserPreference<number>('messageViewMode');
	const messageViewMode = useMemo(() => {
		const modes = ['', 'cozy', 'compact'] as const;
		return modes[viewMode ?? 0] ?? modes[0];
	}, [viewMode]);

	const hasLeader = useReactiveValue(
		useCallback(() => {
			if (RoomRoles.findOne({ 'rid': room._id, 'roles': 'leader', 'u._id': { $ne: user?._id } }, { fields: { _id: 1 } })) {
				return 'has-leader';
			}
		}, [room._id, user?._id]),
	);

	const hasMore = useReactiveValue(useCallback(() => RoomHistoryManager.hasMore(room._id), [room._id]));

	const hasMoreNext = useReactiveValue(useCallback(() => RoomHistoryManager.hasMoreNext(room._id), [room._id]));

	const isLoading = useReactiveValue(useCallback(() => RoomHistoryManager.isLoading(room._id), [room._id]));

	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead') as boolean | undefined;

	const canPreviewChannelRoom = usePermission('preview-c-room');

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

		return !!subscription;
	}, [allowAnonymousRead, canPreviewChannelRoom, room, subscription]);

	const useRealName = useSetting('UI_Use_Real_Name') as boolean;

	const roomLeader = useReactiveValue(
		useCallback(() => {
			const roles = RoomRoles.findOne({
				'rid': room._id,
				'roles': 'leader',
				'u._id': { $ne: user?._id },
			});
			if (roles) {
				const leader = Users.findOne({ _id: roles.u._id }, { fields: { status: 1, statusText: 1 } }) || {};

				return {
					...roles.u,
					name: useRealName ? roles.u.name || roles.u.username : roles.u.username,
					status: leader.status || 'offline',
					statusDisplay: leader.statusText || t(leader.status || 'offline'),
				};
			}
		}, [room._id, t, useRealName, user?._id]),
	);

	const handleOpenUserCardButtonClick = useCallback(
		(username: string) =>
			() =>
			(event: MouseEvent): void => {
				console.log(username);
				event.preventDefault();
				event.stopPropagation();

				openUserCard({
					username,
					rid: room._id,
					target: event.currentTarget,
					open: (e: MouseEvent) => {
						e.preventDefault();
						tabBar.openUserInfo(username);
					},
				});
			},
		[room._id, tabBar],
	);

	const hideUsernames = useUserPreference('hideUsernames');
	const hideUsername = useMemo(() => (hideUsernames ? 'hide-usernames' : undefined), [hideUsernames]);

	const displayAvatars = useUserPreference('displayAvatars');
	const hideAvatar = useMemo(() => (displayAvatars ? undefined : 'hide-avatar'), [displayAvatars]);

	const useLegacyMessageTemplate = useUserPreference<boolean>('useLegacyMessageTemplate');

	const hideSystemMessages = useSetting('Hide_System_Messages') as MessageTypesValues[];

	const messagesHistory = useReactiveValue(
		useCallback(() => {
			const settingValues: MessageTypesValues[] =
				(Array.isArray(room?.sysMes) ? (room.sysMes as MessageTypesValues[]) : hideSystemMessages) || [];
			const hideMessagesOfType = new Set(
				settingValues.reduce(
					(array: MessageTypesValues[], value: MessageTypesValues) => [
						...array,
						...(value === 'mute_unmute' ? (['user-muted', 'user-unmuted'] as const) : ([value] as const)),
					],
					[],
				),
			);
			const query: Mongo.Query<IMessage> = {
				rid: room._id,
				_hidden: { $ne: true },
				$or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }],
				...(hideMessagesOfType.size && { t: { $nin: Array.from(hideMessagesOfType.values()) } }),
			};

			const options = {
				sort: {
					ts: 1,
				},
			};

			return ChatMessage.find(query, options).fetch();
		}, [hideSystemMessages, room._id, room.sysMes]),
	);

	const handleUnreadBarJumpToButtonClick = useCallback(() => {
		const rid = room._id;
		return (event: MouseEvent) => {
			event.preventDefault();

			const room = RoomHistoryManager.getRoom(rid);
			let message = room?.firstUnread.get();
			if (!message) {
				const subscription = Subscriptions.findOne({ rid });
				message = ChatMessage.findOne({ rid, ts: { $gt: subscription?.ls } }, { sort: { ts: 1 }, limit: 1 });
			}
			RoomHistoryManager.getSurroundingMessages(message, 50);
		};
	}, [room._id]);

	const handleMarkAsReadButtonClick = useCallback(() => {
		const rid = room._id;

		return (event: MouseEvent) => {
			event.preventDefault();

			readMessage.readNow(rid);
		};
	}, [room._id]);

	const handleUploadProgressCloseButtonClick = useCallback(
		(id: Uploading['id']) =>
			() =>
			(event: MouseEvent): void => {
				event.preventDefault();
				Session.set(`uploading-cancel-${id}`, true);
			},
		[],
	);

	const retentionPolicy = useRetentionPolicy(room);

	const _messageContext = useReactiveValue(useCallback(() => messageContext({ rid: room._id }), [room._id]));

	const roomOldViewRef = useRef<Blaze.View>();
	const roomOldViewDataRef = useRef(
		new ReactiveVar<RoomTemplateInstance['data']>({
			tabBar,
			rid: room._id,
			room,
			subscription,
			count,
			setCount,
			selectable,
			setSelectable,
			subscribed: !!subscription,
			lastMessage,
			setLastMessage,
			userDetail,
			hideLeaderHeader,
			setHideLeaderHeader,
			unreadCount,
			setUnreadCount,
			selectedMessagesRef,
			selectedRangeRef,
			selectablePointerRef,
			atBottomRef,
			lastScrollTopRef,
			messagesBoxRef,
			wrapperRef,
			selectMessages,
			getSelectedMessages,
			isAtBottom: _isAtBottom,
			sendToBottom,
			sendToBottomIfNecessary,
			checkIfScrollIsAtBottom,
			noNewMessage,
			setNoNewMessage,
			chatMessagesInstance,
			handleNewMessageButtonClick: () => handleNewMessageButtonClick,
			handleJumpToRecentButtonClick: () => handleJumpToRecentButtonClick,
			containerBarsShow,
			unreadData,
			uploading,
			messageViewMode,
			hasLeader,
			hasMore,
			hasMoreNext,
			isLoading,
			canPreview,
			roomLeader,
			handleOpenUserCardButtonClick,
			hideUsername,
			hideAvatar,
			useLegacyMessageTemplate,
			messagesHistory,
			handleUnreadBarJumpToButtonClick,
			handleMarkAsReadButtonClick,
			handleUploadProgressCloseButtonClick,
			retentionPolicy,
			messageContext: _messageContext,
		}),
	);

	useEffect(() => {
		roomOldViewDataRef.current.set({
			tabBar,
			rid: room._id,
			room,
			subscription,
			count,
			setCount,
			selectable,
			setSelectable,
			subscribed: !!subscription,
			lastMessage,
			setLastMessage,
			userDetail,
			hideLeaderHeader,
			setHideLeaderHeader,
			unreadCount,
			setUnreadCount,
			selectedMessagesRef,
			selectedRangeRef,
			selectablePointerRef,
			atBottomRef,
			lastScrollTopRef,
			messagesBoxRef,
			wrapperRef,
			selectMessages,
			getSelectedMessages,
			isAtBottom: _isAtBottom,
			sendToBottom,
			sendToBottomIfNecessary,
			checkIfScrollIsAtBottom,
			noNewMessage,
			setNoNewMessage,
			chatMessagesInstance,
			handleNewMessageButtonClick: () => handleNewMessageButtonClick,
			handleJumpToRecentButtonClick: () => handleJumpToRecentButtonClick,
			containerBarsShow,
			unreadData,
			uploading,
			messageViewMode,
			hasLeader,
			hasMore,
			hasMoreNext,
			isLoading,
			canPreview,
			roomLeader,
			handleOpenUserCardButtonClick,
			hideUsername,
			hideAvatar,
			useLegacyMessageTemplate,
			messagesHistory,
			handleUnreadBarJumpToButtonClick,
			handleMarkAsReadButtonClick,
			handleUploadProgressCloseButtonClick,
			retentionPolicy,
			messageContext: _messageContext,
		});
	}, [
		count,
		getSelectedMessages,
		hideLeaderHeader,
		lastMessage,
		room,
		selectMessages,
		selectable,
		subscription,
		tabBar,
		unreadCount,
		userDetail,
		_isAtBottom,
		sendToBottom,
		sendToBottomIfNecessary,
		checkIfScrollIsAtBottom,
		noNewMessage,
		setNoNewMessage,
		chatMessagesInstance,
		handleNewMessageButtonClick,
		handleJumpToRecentButtonClick,
		containerBarsShow,
		unreadData,
		uploading,
		messageViewMode,
		hasLeader,
		hasMore,
		hasMoreNext,
		isLoading,
		canPreview,
		roomLeader,
		handleOpenUserCardButtonClick,
		hideUsername,
		hideAvatar,
		useLegacyMessageTemplate,
		messagesHistory,
		handleUnreadBarJumpToButtonClick,
		handleMarkAsReadButtonClick,
		handleUploadProgressCloseButtonClick,
		retentionPolicy,
		_messageContext,
	]);

	const divRef = useCallback(
		(div: HTMLDivElement | null): void => {
			if (div?.parentElement) {
				roomOldViewRef.current = Blaze.renderWithData(Template.roomOld, () => roomOldViewDataRef.current.get(), div.parentElement, div);

				div.parentElement.addEventListener(
					'dragenter',
					(event) => {
						fileUploadTriggerProps.onDragEnter(event as any); // TODO: WHY?
					},
					{ capture: true },
				);

				messagesBoxRef.current = div.parentElement.querySelector('.messages-box');
				wrapperRef.current = div.parentElement.querySelector('.wrapper');
				lastScrollTopRef.current = wrapperRef.current?.scrollTop ?? 0;
				return;
			}

			if (roomOldViewRef.current) {
				Blaze.remove(roomOldViewRef.current);
				roomOldViewRef.current = undefined;
				messagesBoxRef.current = null;
				wrapperRef.current = null;
			}
		},
		[fileUploadTriggerProps],
	);

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
					setNoNewMessage(false);
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
		const wrapper = wrapperRef.current;

		if (!wrapper) {
			return;
		}

		chatMessagesInstance.initializeWrapper(wrapper);
		return () => {
			chatMessagesInstance.onDestroyed?.(room._id);
		};
	}, [chatMessagesInstance, room._id]);

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
		if (subscription && (subscription.alert || subscription.unread)) {
			readMessage.refreshUnreadMark(room._id);
		}
	}, [debouncedReadMessageRead, openedRoom, room._id, routeName, subscription]);

	useEffect(() => {
		if (!subscription) {
			setUnreadCount(0);
			return;
		}

		const count = ChatMessage.find({
			rid: room._id,
			ts: { $lte: lastMessage, $gt: subscription?.ls },
		}).count();

		setUnreadCount(count);
	}, [lastMessage, room._id, subscription]);

	const unreadNotLoaded = useReactiveValue(useCallback(() => RoomHistoryManager.getRoom(room._id).unreadNotLoaded.get(), [room._id]));

	useEffect(() => {
		setCount(unreadNotLoaded + unreadCount);
	}, [unreadCount, unreadNotLoaded]);

	useEffect(() => {
		if (count === 0) {
			return debouncedReadMessageRead();
		}
		readMessage.refreshUnreadMark(room._id);
	}, [count, debouncedReadMessageRead, room._id]);

	useEffect(() => {
		const handleReadMessage = (): void => setUnreadCount(0);
		readMessage.on(room._id, handleReadMessage);

		return () => {
			readMessage.off(room._id, handleReadMessage);
		};
	}, [room._id]);

	useEffect(() => {
		const messageList = wrapperRef.current?.querySelector('ul');

		if (!messageList) {
			return;
		}

		const messageEvents: Record<string, (event: any, template: RoomTemplateInstance) => void> = {
			...getCommonRoomEvents(),
			'click .toggle-hidden'(event: JQuery.ClickEvent) {
				const mid = event.target.dataset.message;
				if (mid) document.getElementById(mid)?.classList.toggle('message--ignored');
			},
			'click .message'(event: JQuery.ClickEvent, template: RoomTemplateInstance) {
				const { selectable, selectMessages, getSelectedMessages } = template.data;

				if (!selectable) {
					return;
				}

				window.getSelection?.()?.removeAllRanges();
				const data = Blaze.getData(event.target);
				const {
					msg: { _id },
				} = messageArgs(data);

				if (!selectablePointerRef.current) {
					selectablePointerRef.current = _id;
				}

				if (!event.shiftKey) {
					selectedMessagesRef.current = getSelectedMessages();
					selectedRangeRef.current = [];
					selectablePointerRef.current = _id;
				}

				selectMessages(_id);

				const selectedMessages = Array.from(messageList.querySelectorAll('.message.selected')).map((message) => message.id);
				const removeClass = difference(selectedMessages, getSelectedMessages());
				const addClass = difference(getSelectedMessages(), selectedMessages);
				removeClass.forEach((mid) => document.getElementById(mid)?.classList.remove('selected'));
				addClass.forEach((mid) => document.getElementById(mid)?.classList.add('selected'));
			},
			'load .gallery-item'(_event: unknown, template: RoomTemplateInstance) {
				const { sendToBottomIfNecessary } = template.data;
				sendToBottomIfNecessary();
			},
			'rendered .js-block-wrapper'(_event: unknown, template: RoomTemplateInstance) {
				const { sendToBottomIfNecessary } = template.data;
				sendToBottomIfNecessary();
			},
		};

		const eventHandlers = Object.entries(messageEvents).map(([key, handler]) => {
			const [, event, selector] = key.match(/^(.+?)\s(.+)$/) ?? [key, key];
			return {
				event,
				selector,
				listener: (e: JQuery.TriggeredEvent<HTMLUListElement, undefined>) =>
					handler.call(
						null,
						e,
						Blaze.getView(roomOldViewRef.current?.firstNode() as HTMLElement).templateInstance() as RoomTemplateInstance,
					),
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
	}, []);

	const updateUnreadCount = useMemo(() => {
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

		return withThrottling({ wait: 300 })(() => {
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
	}, []);

	const handleWrapperScroll = useMemo(
		() =>
			withThrottling({ wait: 100 })((event) => {
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
						RoomHistoryManager.getMoreNext(room._id);
					}
				}
			}),
		[_isAtBottom, room._id],
	);

	useEffect(() => {
		const wrapper = wrapperRef.current;

		if (!wrapper) {
			return;
		}

		wrapper.addEventListener('scroll', updateUnreadCount);
		wrapper.addEventListener('scroll', handleWrapperScroll);

		return () => {
			wrapper.removeEventListener('scroll', updateUnreadCount);
			wrapper.removeEventListener('scroll', handleWrapperScroll);
		};
	}, [handleWrapperScroll, updateUnreadCount]);

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

		wrapper.addEventListener('mousewheel', handleWheel);

		wrapper.addEventListener('wheel', handleWheel);

		Tracker.afterFlush(() => {
			wrapper.addEventListener('scroll', handleWheel);
		});

		wrapper.addEventListener('touchstart', () => {
			atBottomRef.current = false;
		});

		wrapper.addEventListener('touchend', () => {
			checkIfScrollIsAtBottom();
			setTimeout(() => checkIfScrollIsAtBottom(), 1000);
			setTimeout(() => checkIfScrollIsAtBottom(), 2000);
		});
	}, [checkIfScrollIsAtBottom]);

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
							<div ref={divRef} />
							<ComposerContainer rid={room._id} subscription={subscription} sendToBottomIfNecessary={sendToBottomIfNecessary} />
						</div>
					</div>
				</section>
			</div>
		</>
	);
};

export default memo(RoomBody);
