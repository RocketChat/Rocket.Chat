import type { IRoom, IUser, MessageAttachment } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Messages } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { notifyOnMessageChange } from '../../../lib/server/lib/notifyListener';
import { API } from '../api';

const MIN_INTERVAL_MS = 3000;

// Type definitions for API route contexts
interface IAPIRouteContext {
	bodyParams: {
		rid?: string;
		msgId?: string;
		durationSec?: number;
		initial?: { lat: number; lon: number };
		coords?: { lat: number; lon: number };
		finalCoords?: { lat: number; lon: number };
	};
	queryParams: {
		rid?: string;
		msgId?: string;
	};
	userId: string;
}

interface IUserWithName extends IUser {
	name?: string;
}

interface ILiveLocationAttachment {
	type: 'live-location';
	live: {
		isActive: boolean;
		ownerId: string;
		startedAt: Date;
		lastUpdateAt: Date;
		expiresAt?: Date;
		stoppedAt?: Date;
		coords?: { lat: number; lon: number };
		version: number;
	};
}

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Meteor {
		user(): IUser | null;
	}
}

// Start live location sharing
API.v1.addRoute(
	'liveLocation.start',
	{ authRequired: true },
	{
		async post(this: IAPIRouteContext) {
			const { rid, durationSec, initial } = this.bodyParams;

			if (!rid || typeof rid !== 'string') {
				return API.v1.failure('The required "rid" param is missing or invalid.');
			}

			const uid = this.userId;
			if (!uid) {
				return API.v1.failure('User not authenticated');
			}

			const room = await Rooms.findOneById<IRoom>(rid);
			if (!room) {
				return API.v1.failure('Room not found');
			}

			const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid);
			if (!sub) {
				return API.v1.failure('User is not in the room');
			}

			if (!(await canAccessRoomIdAsync(rid, uid))) {
				return API.v1.failure('Not allowed');
			}

			const existing = await Messages.findOne({
				rid,
				'u._id': uid,
				'attachments': {
					$elemMatch: {
						'type': 'live-location',
						'live.isActive': true,
					},
				},
			});

			if (existing) {
				return API.v1.success({ msgId: existing._id });
			}

			const now = new Date();
			const expiresAt = durationSec ? new Date(now.getTime() + durationSec * 1000) : undefined;
			const user = await Meteor.users.findOneAsync(
				{ _id: uid },
				{
					projection: { username: 1, name: 1 },
				},
			);

			if (!user) {
				return API.v1.failure('User not found');
			}

			const msg = {
				rid,
				ts: now,
				msg: '',
				u: {
					_id: uid,
					username: user.username || '',
					name: (user as IUserWithName).name || user.username || '',
				},
				attachments: [
					{
						type: 'live-location',
						live: {
							isActive: true,
							ownerId: uid,
							startedAt: now,
							lastUpdateAt: now,
							expiresAt,
							coords: initial || undefined,
							version: 1,
						},
					} as MessageAttachment,
				],
			};

			try {
				const result = await Messages.insertOne(msg);

				const createdMsg = await Messages.findOneById(result.insertedId);
				if (createdMsg) {
					void notifyOnMessageChange({
						id: createdMsg._id,
						data: createdMsg,
					});
				}

				return API.v1.success({ msgId: result.insertedId });
			} catch (insertError) {
				return API.v1.failure('Failed to create live location message');
			}
		},
	},
);

// Update live location coordinates
API.v1.addRoute(
	'liveLocation.update',
	{ authRequired: true },
	{
		async post(this: IAPIRouteContext) {
			const { rid, msgId, coords } = this.bodyParams;

			if (!rid || typeof rid !== 'string') {
				return API.v1.failure('The required "rid" param is missing or invalid.');
			}

			if (!msgId || typeof msgId !== 'string') {
				return API.v1.failure('The required "msgId" param is missing or invalid.');
			}

			if (!coords || typeof coords !== 'object') {
				return API.v1.failure('The required "coords" param is missing or invalid.');
			}

			const uid = this.userId;
			if (!uid) {
				return API.v1.failure('User not authenticated');
			}

			if (!(await canAccessRoomIdAsync(rid, uid))) {
				return API.v1.failure('Not allowed');
			}

			const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid);
			if (!sub) {
				return API.v1.failure('User is not in the room');
			}

			const msg = await Messages.findOne({
				'_id': msgId,
				rid,
				'u._id': uid,
				'attachments': {
					$elemMatch: {
						'type': 'live-location',
						'live.isActive': true,
					},
				},
			});

			if (!msg) {
				return API.v1.failure('Active live location not found');
			}

			const last: Date | undefined = (msg.attachments?.[0] as ILiveLocationAttachment)?.live?.lastUpdateAt;
			const now = new Date();
			if (last && now.getTime() - new Date(last).getTime() < MIN_INTERVAL_MS) {
				return API.v1.success({ ignored: true, reason: 'too-soon' });
			}

			const updateTime = new Date();
			const res = await Messages.updateOne(
				{ _id: msgId },
				{
					$set: {
						'attachments.0.live.coords': coords,
						'attachments.0.live.lastUpdateAt': updateTime,
					},
				},
			);

			if (res.modifiedCount > 0) {
				const updatedMsg = await Messages.findOneById(msgId);
				if (updatedMsg) {
					void notifyOnMessageChange({
						id: updatedMsg._id,
						data: updatedMsg,
					});
				}
			}

			return API.v1.success({ updated: Boolean(res.modifiedCount) });
		},
	},
);

// Stop live location sharing
API.v1.addRoute(
	'liveLocation.stop',
	{ authRequired: true },
	{
		async post(this: IAPIRouteContext) {
			const { rid, msgId, finalCoords } = this.bodyParams;

			if (!rid || typeof rid !== 'string') {
				return API.v1.failure('The required "rid" param is missing or invalid.');
			}

			if (!msgId || typeof msgId !== 'string') {
				return API.v1.failure('The required "msgId" param is missing or invalid.');
			}

			const uid = this.userId;
			if (!uid) {
				return API.v1.failure('User not authenticated');
			}

			if (!(await canAccessRoomIdAsync(rid, uid))) {
				return API.v1.failure('Not allowed');
			}

			const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid);
			if (!sub) {
				return API.v1.failure('User is not in the room');
			}

			const selector = {
				'_id': msgId,
				rid,
				'u._id': uid,
				'attachments': {
					$elemMatch: {
						'type': 'live-location',
						'live.isActive': true,
					},
				},
			};

			const modifier: {
				$set: {
					'attachments.0.live.isActive': boolean;
					'attachments.0.live.stoppedAt': Date;
					'attachments.0.live.coords'?: { lat: number; lon: number };
				};
			} = {
				$set: {
					'attachments.0.live.isActive': false,
					'attachments.0.live.stoppedAt': new Date(),
				},
			};

			if (finalCoords) {
				modifier.$set['attachments.0.live.coords'] = finalCoords;
			}

			const res = await Messages.updateOne(selector, modifier);
			const success = Boolean(res.modifiedCount);

			if (success) {
				const updatedMsg = await Messages.findOneById(msgId);
				if (updatedMsg) {
					void notifyOnMessageChange({
						id: updatedMsg._id,
						data: updatedMsg,
					});
				}
			}

			return API.v1.success({ stopped: success });
		},
	},
);

// Get live location data
API.v1.addRoute(
	'liveLocation.get',
	{ authRequired: true },
	{
		async get(this: IAPIRouteContext) {
			const { rid, msgId } = this.queryParams;

			if (!rid || typeof rid !== 'string') {
				return API.v1.failure('The required "rid" param is missing or invalid.');
			}

			if (!msgId || typeof msgId !== 'string') {
				return API.v1.failure('The required "msgId" param is missing or invalid.');
			}

			const uid = this.userId;
			if (!uid) {
				return API.v1.failure('User not authenticated');
			}

			if (!(await canAccessRoomIdAsync(rid, uid))) {
				return API.v1.failure('Not allowed');
			}

			const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid);
			if (!sub) {
				return API.v1.failure('User is not in the room');
			}

			const msg = await Messages.findOne({
				_id: msgId,
				rid,
				attachments: {
					$elemMatch: {
						type: 'live-location',
					},
				},
			});

			if (!msg) {
				return API.v1.failure('Live location not found');
			}

			const attachment = msg.attachments?.find(
				(att: unknown): att is ILiveLocationAttachment => (att as ILiveLocationAttachment)?.type === 'live-location',
			) as ILiveLocationAttachment;
			if (!attachment) {
				return API.v1.failure('Live location attachment not found');
			}

			return API.v1.success({
				messageId: msg._id,
				ownerId: attachment.live?.ownerId,
				ownerUsername: msg.u?.username,
				ownerName: (msg.u as { name?: string; username?: string })?.name || msg.u?.username,
				isActive: attachment.live?.isActive || false,
				startedAt: attachment.live?.startedAt ? new Date(attachment.live.startedAt) : undefined,
				lastUpdateAt: attachment.live?.lastUpdateAt ? new Date(attachment.live.lastUpdateAt) : undefined,
				stoppedAt: attachment.live?.stoppedAt ? new Date(attachment.live.stoppedAt) : undefined,
				coords: attachment.live?.coords,
				expiresAt: attachment.live?.expiresAt ? new Date(attachment.live.expiresAt) : undefined,
				version: attachment.live?.version || 1,
			});
		},
	},
);
