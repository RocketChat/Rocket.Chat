import {
	isOmnichannelRoom,
	type ILivechatInquiryRecord,
	type IRoom,
	type IRoomWithRetentionPolicy,
	type ISubscription,
	LivechatPriorityWeight,
	DEFAULT_SLA_CONFIG,
} from '@rocket.chat/core-typings';
import { useDebouncedState } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useUserPreference, useSetting, useStream, useUserId, useMethod } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { CachedChatRoom, CachedChatSubscription } from '../../../app/models/client';
import { useVideoConfIncomingCalls } from '../../contexts/VideoConfContext';
import { useOmnichannelEnabled } from '../../hooks/omnichannel/useOmnichannelEnabled';
import { useQueuedInquiries } from '../../hooks/omnichannel/useQueuedInquiries';
import { useQueryOptions } from './useQueryOptions';

const query = { open: { $ne: false } };

const emptyQueue: ILivechatInquiryRecord[] = [];

const isIRoomWithRetentionPolicy = (room: IRoom): room is IRoomWithRetentionPolicy => 'retentionPolicy' in room;

const mergeSubscriptionWithRoom = (subscription: ISubscription, room: IRoom | undefined): SubscriptionWithRoom => {
	const lastRoomUpdate = room?.lm || subscription.ts || room?.ts;

	return {
		...subscription,
		...(() => {
			const { name } = subscription;
			const fname = subscription.fname || name;
			return {
				lowerCaseName: String(!subscription.prid ? name : fname).toLowerCase(),
				lowerCaseFName: String(fname).toLowerCase(),
			};
		})(),
		encrypted: room?.encrypted,
		description: room?.description,
		cl: room?.cl,
		topic: room?.topic,
		announcement: room?.announcement,
		broadcast: room?.broadcast,
		archived: room?.archived,
		avatarETag: room?.avatarETag,
		lastMessage: room?.lastMessage,
		streamingOptions: room?.streamingOptions,
		teamId: room?.teamId,
		teamMain: room?.teamMain,
		uids: room?.uids,
		usernames: room?.usernames,
		usersCount: room?.usersCount ?? 0,
		lm: subscription.lr ? new Date(Math.max(subscription.lr.getTime(), lastRoomUpdate?.getTime() || 0)) : lastRoomUpdate,

		...(room && isIRoomWithRetentionPolicy(room) && { retention: room.retention }),

		...(room &&
			isOmnichannelRoom(room) && {
				v: room?.v,
				transcriptRequest: room?.transcriptRequest,
				servedBy: room?.servedBy,
				onHold: room?.onHold,
				tags: room?.tags,
				closedAt: room?.closedAt,
				metrics: room?.metrics,
				muted: room?.muted,
				waitingResponse: room?.waitingResponse,
				responseBy: room?.responseBy,
				priorityId: room?.priorityId,
				slaId: room?.slaId,
				priorityWeight: room?.priorityWeight || LivechatPriorityWeight.NOT_SPECIFIED,
				estimatedWaitingTimeQueue: room?.estimatedWaitingTimeQueue || DEFAULT_SLA_CONFIG.ESTIMATED_WAITING_TIME_QUEUE,
				livechatData: room?.livechatData,
				departmentId: room?.departmentId,
				ts: room?.ts ?? subscription.ts,
				source: room?.source,
				queuedAt: room?.queuedAt,
				federated: room?.federated,
			}),
	} as SubscriptionWithRoom;
};

const findRoomAndRemove = (array: IRoom[], rid: string): IRoom | undefined => {
	const index = array.findIndex((room) => room._id === rid);
	const room = index !== -1 ? array.splice(index, 1)[0] : undefined;
	return room;
};

// receive an array of functions and execute them in sequence
const executeFunctions = (...functions: Array<() => void>): (() => void) => {
	return () => functions.forEach((func) => func());
};

export const useSubscriptions = () => {
	const queryClient = useQueryClient();
	const ref = useRef<() => void>();

	const [, sorter] = useQueryOptions();

	const listener = useStream('notify-user');
	const getSubscription = useMethod('subscriptions/get');
	const getRooms = useMethod('rooms/get');
	const uid = useUserId();

	useEffect(() => () => ref.current?.(), [uid]);

	return useQuery(
		['subscriptions', query, uid],
		async () => {
			ref.current = executeFunctions(
				listener(`${uid}/rooms-changed`, (action, record) => {
					CachedChatRoom.handleEvent(action === 'removed' ? action : 'changed', record);

					switch (action) {
						case 'inserted':
						case 'updated':
							return queryClient.setQueryData<ISubscription[]>(['subscriptions', query, uid], (old) => {
								if (!old) return old;
								return old.map((subscription) => {
									if (subscription.rid === record._id) {
										return mergeSubscriptionWithRoom(subscription, record);
									}
									return subscription;
								});
							});
						case 'removed':
							return queryClient.setQueryData<ISubscription[]>(['subscriptions', query, uid], (old) => {
								if (!old) return old;
								return old.filter((subscription) => subscription.rid !== record._id);
							});
					}
				}),
				listener(`${uid}/subscriptions-changed`, (action, record) => {
					CachedChatSubscription.handleEvent(action === 'removed' ? action : 'changed', record as ISubscription);
					switch (action) {
						case 'inserted':
						case 'updated':
							return queryClient.setQueryData<ISubscription[]>(['subscriptions', query, uid], (old) => {
								if (!old) return old;
								return old.map((subscription) => {
									if (subscription.rid === record.rid) {
										return mergeSubscriptionWithRoom(subscription, record as unknown as IRoom);
									}
									return subscription;
								});
							});
						case 'removed':
							return queryClient.setQueryData<ISubscription[]>(['subscriptions', query, uid], (old) => {
								if (!old) return old;
								return old.filter((subscription) => subscription.rid !== record.rid);
							});
					}
				}),
			);

			const [subscriptions, rooms] = await Promise.all([getSubscription(), getRooms()]);

			if (!Array.isArray(subscriptions) || !Array.isArray(rooms)) {
				throw new Error('subscriptions-not-found');
			}

			Array.isArray(subscriptions) && CachedChatSubscription.applyFromServer(subscriptions);
			Array.isArray(rooms) && CachedChatRoom.applyFromServer(rooms);

			return subscriptions
				.map((subscription) => {
					const room = findRoomAndRemove(rooms, subscription.rid);
					return mergeSubscriptionWithRoom(subscription, room);
				})
				.filter((subscription) => subscription.archived || subscription.open !== false);
		},
		{
			select: (data) => {
				return Array.isArray(data) ? sorter(data.filter((subscription) => subscription.open !== false)) : data;
			},
			suspense: true,
		},
	);
};

export const useRoomList = (): Array<ISubscription & IRoom> => {
	const [roomList, setRoomList] = useDebouncedState<(ISubscription & IRoom)[]>([], 150);

	const showOmnichannel = useOmnichannelEnabled();
	const sidebarGroupByType = useUserPreference('sidebarGroupByType');
	const favoritesEnabled = useUserPreference('sidebarShowFavorites');
	const isDiscussionEnabled = useSetting('Discussion_enabled');
	const sidebarShowUnread = useUserPreference('sidebarShowUnread');

	const result = useSubscriptions();

	const inquiries = useQueuedInquiries();

	const incomingCalls = useVideoConfIncomingCalls();

	let queue = emptyQueue;
	if (inquiries.enabled) {
		queue = inquiries.queue;
	}

	useEffect(() => {
		if (!result.data) {
			return;
		}

		const rooms = result.data;
		setRoomList(() => {
			const incomingCall = new Set();
			const favorite = new Set();
			const team = new Set();
			const omnichannel = new Set();
			const unread = new Set();
			const channels = new Set();
			const direct = new Set();
			const discussion = new Set();
			const conversation = new Set();
			const onHold = new Set();

			rooms.forEach((room) => {
				if (room.archived) {
					return;
				}

				if (incomingCalls.find((call) => call.rid === room.rid)) {
					return incomingCall.add(room);
				}

				if (sidebarShowUnread && (room.alert || room.unread) && !room.hideUnreadStatus) {
					return unread.add(room);
				}

				if (favoritesEnabled && room.f) {
					return favorite.add(room);
				}

				if (sidebarGroupByType && room.teamMain) {
					return team.add(room);
				}

				if (sidebarGroupByType && isDiscussionEnabled && room.prid) {
					return discussion.add(room);
				}

				if (room.t === 'c' || room.t === 'p') {
					channels.add(room);
				}

				if (room.t === 'l' && room.onHold) {
					return showOmnichannel && onHold.add(room);
				}

				if (room.t === 'l') {
					return showOmnichannel && omnichannel.add(room);
				}

				if (room.t === 'd') {
					direct.add(room);
				}

				conversation.add(room);
			});

			const groups = new Map();
			showOmnichannel && groups.set('Omnichannel', []);
			incomingCall.size && groups.set('Incoming Calls', incomingCall);
			showOmnichannel && inquiries.enabled && queue.length && groups.set('Incoming_Livechats', queue);
			showOmnichannel && omnichannel.size && groups.set('Open_Livechats', omnichannel);
			showOmnichannel && onHold.size && groups.set('On_Hold_Chats', onHold);
			sidebarShowUnread && unread.size && groups.set('Unread', unread);
			favoritesEnabled && favorite.size && groups.set('Favorites', favorite);
			sidebarGroupByType && team.size && groups.set('Teams', team);
			sidebarGroupByType && isDiscussionEnabled && discussion.size && groups.set('Discussions', discussion);
			sidebarGroupByType && channels.size && groups.set('Channels', channels);
			sidebarGroupByType && direct.size && groups.set('Direct_Messages', direct);
			!sidebarGroupByType && groups.set('Conversations', conversation);
			return [...groups.entries()].flatMap(([key, group]) => [key, ...group]);
		});
	}, [
		showOmnichannel,
		incomingCalls,
		inquiries.enabled,
		queue,
		sidebarShowUnread,
		favoritesEnabled,
		sidebarGroupByType,
		setRoomList,
		isDiscussionEnabled,
		result.data,
	]);

	return roomList;
};
