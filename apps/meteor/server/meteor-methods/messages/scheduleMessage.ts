import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';
import { check,Match } from 'meteor/check';

import { RateLimiterClass as RateLimiter } from '../../lib/RateLimiter';
import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';
// Import your custom model here
import { ScheduledMessages } from '@rocket.chat/models'; 

// 1. Augment ServerMethods so Meteor.call('scheduleMessage') is strictly typed
declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		scheduleMessage(message: Partial<IMessage>, scheduledAt: Date): Promise<string>;
	}
}

// 2. Export the pure business logic function
export async function executeScheduleMessage(
	user: IUser,
	message: Partial<IMessage>,
	scheduledAt: Date,
): Promise<string> {
	if (!message.rid) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', { method: 'scheduleMessage' });
	}

    if (!message.msg) {
        throw new ClientSafeError('error-invalid-message', 'Message cannot be empty', { method: 'scheduleMessage' });
    }

	if (!(await canAccessRoomIdAsync(message.rid, user._id))) {
		throw new ClientSafeError('error-not-allowed', 'Not allowed', { method: 'scheduleMessage' });
	}

	if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
		throw new ClientSafeError('error-invalid-date', 'Scheduled date must be in the future', {
			method: 'scheduleMessage',
		});
	}

	// 3. Insert the validated message into the MongoDB collection
	const result = await ScheduledMessages.insertOne({
        msg: message.msg,
        rid: message.rid,
        u: { _id: user._id, username: user.username },
        ts: new Date(),
        deliverAt: scheduledAt,
        status: 'pending',
        _updatedAt: new Date()
    });

	return result.insertedId; // Returns the DB id to the client
}

// 4. Register the Meteor Method handler
Meteor.methods<ServerMethods>({
    async scheduleMessage(message, scheduledAt) {
        check(message, Object);
        // FIX: Accept both Date (if called internally) and String (if called from REST API)
        check(scheduledAt, Match.OneOf(Date, String)); 

        const user = (await Meteor.userAsync()) as IUser;
        if (!user) {
            throw new ClientSafeError('error-invalid-user', 'Invalid user', { method: 'scheduleMessage' });
        }

       
        return executeScheduleMessage(user, message, new Date(scheduledAt));
    },
});


// 5. Rate-limit the method to prevent spam (max 5 requests per second per user)
RateLimiter.limitMethod('scheduleMessage', 5, 1000, {
	userId: () => true,
});