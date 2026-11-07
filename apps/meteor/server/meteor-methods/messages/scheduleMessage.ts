import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { ScheduledMessages } from '@rocket.chat/models';
import { check, Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { RateLimiterClass as RateLimiter } from '../../lib/RateLimiter';
import { canSendMessageAsync } from '../../lib/authorization/canSendMessage';
import { settings } from '../../settings';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		scheduleMessage(message: Partial<IMessage>, scheduledAt: Date | string): Promise<string>;
	}
}

export async function executeScheduleMessage(
	user: IUser,
	message: Partial<IMessage>,
	scheduledAt: Date | string,
): Promise<string> {
	if (!message.rid) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', { method: 'scheduleMessage' });
	}

	if (typeof message.msg !== 'string' || !message.msg.trim()) {
		throw new ClientSafeError('error-invalid-message', 'Message cannot be empty', { method: 'scheduleMessage' });
	}

	const maxAllowedSize = settings.get<number>('Message_MaxAllowedSize') ?? 0;
	if (maxAllowedSize > 0 && message.msg.length > maxAllowedSize) {
		throw new ClientSafeError('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize', {
			method: 'scheduleMessage',
		});
	}

	try {
		await canSendMessageAsync(message.rid, user);
	} catch (error: any) {
		throw new ClientSafeError(error.message || 'error-not-allowed', error.message || 'Not allowed', {
			method: 'scheduleMessage',
		});
	}

	const scheduledDate = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);
	if (!scheduledAt || isNaN(scheduledDate.getTime()) || !isFinite(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
		throw new ClientSafeError('error-invalid-date', 'Scheduled date must be in the future', {
			method: 'scheduleMessage',
		});
	}

	const result = await ScheduledMessages.insertOne({
		msg: message.msg,
		rid: message.rid,
		...(message.tmid && { tmid: message.tmid }),
		...(message.tshow && { tshow: message.tshow }),
		u: { _id: user._id, username: user.username },
		ts: new Date(),
		deliverAt: scheduledDate,
		status: 'pending',
		_updatedAt: new Date(),
	});

	return result.insertedId;
}

Meteor.methods<ServerMethods>({
	async scheduleMessage(message, scheduledAt) {
		check(message, Object);
		check(scheduledAt, Match.OneOf(Date, String));

		const date = scheduledAt instanceof Date ? scheduledAt : new Date(scheduledAt);
		if (isNaN(date.getTime()) || !isFinite(date.getTime())) {
			throw new ClientSafeError('error-invalid-date', 'Scheduled date must be a valid future date', {
				method: 'scheduleMessage',
			});
		}

		const user = (await Meteor.userAsync()) as IUser;
		if (!user) {
			throw new ClientSafeError('error-invalid-user', 'Invalid user', { method: 'scheduleMessage' });
		}

		return executeScheduleMessage(user, message, date);
	},
});

RateLimiter.limitMethod('scheduleMessage', 5, 1000, {
	userId: () => true,
});
