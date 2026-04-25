// @ts-nocheck
import { Messages, Rooms, Users } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { API } from '../api';

API.v1
	.post(
		'chat.scheduleMessage',
		{ authRequired: true },
		async function action() {
			check(this.bodyParams, {
				roomId: String,
				message: String,
				scheduledAt: String,
				tmid: Match.Maybe(String),
			});

			const { roomId, message, scheduledAt, tmid } = this.bodyParams;

			if (!this.userId) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'chat.scheduleMessage' });
			}

			const room = await Rooms.findOneById(roomId);
			if (!room) {
				throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'chat.scheduleMessage' });
			}

			if (!(await canAccessRoomIdAsync(roomId, this.userId))) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'chat.scheduleMessage' });
			}

			const scheduledDate = new Date(scheduledAt);
			if (isNaN(scheduledDate.getTime())) {
				throw new Meteor.Error('error-invalid-date', 'Invalid date format', { method: 'chat.scheduleMessage' });
			}

			if (scheduledDate <= new Date()) {
				throw new Meteor.Error('error-past-date', 'Scheduled date must be in the future', { method: 'chat.scheduleMessage' });
			}

			const user = await Users.findOneById(this.userId);
			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'chat.scheduleMessage' });
			}

			const messageData: any = {
				rid: roomId,
				msg: message,
				u: {
					_id: user._id,
					username: user.username as string,
					name: user.name,
				},
				ts: new Date(),
				scheduledAt: scheduledDate,
				scheduled: true,
				...(tmid && { tmid }),
			};

			const result = await Messages.insertOne(messageData);

			return API.v1.success({
				message: {
					...messageData,
					_id: result.insertedId,
					_updatedAt: new Date(),
				},
			});
		},
	)
	.get(
		'chat.getScheduledMessages',
		{ authRequired: true },
		async function action() {
			const { roomId, count = 50, offset = 0 } = this.queryParams;

			check(roomId, String);
			check(count, Match.Maybe(Number));
			check(offset, Match.Maybe(Number));

			if (!this.userId) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'chat.getScheduledMessages' });
			}

			if (!(await canAccessRoomIdAsync(roomId, this.userId))) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'chat.getScheduledMessages' });
			}

			const messages = await Messages.find(
				{
					rid: roomId,
					'u._id': this.userId,
					scheduled: true,
					scheduledAt: { $exists: true },
				},
				{
					sort: { scheduledAt: 1 },
					skip: Number(offset),
					limit: Number(count),
				},
			).toArray();

			const total = await Messages.countDocuments({
				rid: roomId,
				'u._id': this.userId,
				scheduled: true,
				scheduledAt: { $exists: true },
			});

			return API.v1.success({
				messages,
				count: messages.length,
				offset,
				total,
			});
		},
	)
	.post(
		'chat.cancelScheduledMessage',
		{ authRequired: true },
		async function action() {
			check(this.bodyParams, {
				messageId: String,
			});

			const { messageId } = this.bodyParams;

			if (!this.userId) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'chat.cancelScheduledMessage' });
			}

			const message = await Messages.findOneById(messageId);
			if (!message) {
				throw new Meteor.Error('error-message-not-found', 'Scheduled message not found', {
					method: 'chat.cancelScheduledMessage',
				});
			}

			if (message.u._id !== this.userId) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'chat.cancelScheduledMessage' });
			}

			if (!message.scheduled) {
				throw new Meteor.Error('error-not-scheduled', 'Message is not scheduled', {
					method: 'chat.cancelScheduledMessage',
				});
			}

			await Messages.deleteOne({ _id: messageId });

			return API.v1.success({ success: true });
		},
	);
