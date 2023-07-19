import {
	isOmnichannelRoom,
	type IRoom,
	type IRoomWithRetentionPolicy,
	type ISubscription,
	LivechatPriorityWeight,
	DEFAULT_SLA_CONFIG,
} from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useStream, useUserId, useMethod } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useQueryOptions } from './useQueryOptions';

const query = { open: { $ne: false } };

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

export const useSubscriptions = ({
	handleSubscription,
	handleRoom,
	applyFromServer,
}: {
	handleSubscription?: (action: 'inserted' | 'updated' | 'removed', subscription: ISubscription) => void;
	handleRoom?: (action: 'inserted' | 'updated' | 'removed', room: IRoom) => void;
	applyFromServer?(subscriptions: ISubscription[], rooms: IRoom[]): void;
} = {}) => {
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
		async ({ queryKey }) => {
			const temp = new Map<
				string,
				{
					room?: IRoom;
					subscription?: ISubscription;
				}
			>();

			ref.current = executeFunctions(
				listener(`${uid}/rooms-changed`, (action, record) => {
					handleRoom?.(action, record);

					return queryClient.setQueryData<Map<string, SubscriptionWithRoom>>(queryKey, (store) => {
						if (!store) return store;
						const oldRecord = store.get(record._id);
						switch (action) {
							case 'inserted':
								if (oldRecord) {
									temp.delete(record._id);
									store.set(record._id, mergeSubscriptionWithRoom(oldRecord, record));
									break;
								}
								temp.set(record._id, { room: record });
								return store;
							case 'updated':
								if (!oldRecord) {
									console.warn('room not found in store', record);
									return store;
								}

								store.set(record._id, mergeSubscriptionWithRoom(oldRecord, record));
								break;
							case 'removed':
								if (!record._id) {
									console.warn('subscription not found in store', record);
									return store;
								}
								store.delete(record._id);
								break;
						}
						return new Map(store);
					});
				}),
				listener(`${uid}/subscriptions-changed`, (action, record) => {
					handleSubscription?.(action, record as ISubscription);
					return queryClient.setQueryData<Map<string, SubscriptionWithRoom>>(queryKey, (store) => {
						if (!store) return store;

						if (!record.rid) {
							console.warn('subscription not found in store', record);
							return store;
						}

						const oldRecord = store.get(record.rid);
						switch (action) {
							case 'inserted':
								if (oldRecord) {
									temp.delete(record.rid);
									store.set(record.rid, mergeSubscriptionWithRoom(record as ISubscription, oldRecord as unknown as IRoom));
									break;
								}

								temp.set(record.rid, { subscription: record as ISubscription });

								return store;
							case 'updated':
								if (!oldRecord) {
									console.warn('subscription not found in store', record);
									return store;
								}
								store.set(record.rid, mergeSubscriptionWithRoom(record as ISubscription, oldRecord as unknown as IRoom));
								break;
							case 'removed':
								if (!record.rid) {
									console.warn('subscription not found in store', record);
									return store;
								}
								store.delete(record.rid);
						}
						return new Map(store);
					});
				}),
			);

			const [subscriptions, rooms] = await Promise.all([getSubscription(), getRooms()]);

			if (!Array.isArray(subscriptions) || !Array.isArray(rooms)) {
				throw new Error('subscriptions-not-found');
			}

			applyFromServer?.(subscriptions, rooms);

			return new Map<string, SubscriptionWithRoom>(
				subscriptions.map((subscription) => {
					const room = findRoomAndRemove(rooms, subscription.rid);
					return [subscription.rid, mergeSubscriptionWithRoom(subscription, room)] as [string, SubscriptionWithRoom];
				}),
			);
		},
		{
			select: (data) => {
				return sorter([...data.values()].filter((subscription) => subscription.archived || subscription.open !== false));
			},
			suspense: true,
		},
	);
};
