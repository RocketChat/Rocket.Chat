import { cronJobs } from '@rocket.chat/cron';
import { Rooms, ScheduledMessages, Users } from '@rocket.chat/models';

import { sendMessage } from '../../app/lib/server/functions/sendMessage';
import { notifyOnRoomChangedById, notifyOnMessageChange } from '../../app/lib/server/lib/notifyListener';
import { SystemLogger } from '../lib/logger/system';

export async function scheduleMessagesCron(): Promise<void> {
	const name = 'sendScheduledMessages';

	return cronJobs.add(name, '*/1 * * * *', async () => {
		SystemLogger.info('Checking for scheduled messages..');
		const now = new Date();

		const scheduledMessages = await ScheduledMessages.findByScheduledAtBefore(now);

		console.log(`Found ${scheduledMessages.length} scheduled messages to process`);

		/* eslint-disable no-await-in-loop */
		for (const message of scheduledMessages) {
			console.log(`Processing message ${message._id} scheduled for ${message.scheduledAt.toISOString()}`);
			try {
				const user = await Users.findOneById(message.u._id, {
					projection: { username: 1, type: 1, name: 1 },
				});
				if (!user) {
					console.error(`User ${message.u._id} not found for scheduled message ${message._id}`);
					continue;
				}

				const room = await Rooms.findOneById(message.rid);
				if (!room) {
					console.error(`Room ${message.rid} not found for scheduled message ${message._id}`);
					continue;
				}

				const messageToSend = {
					rid: message.rid,
					msg: message.msg,
					u: { _id: user._id, username: user.username, name: user.name },
					ts: message.scheduledAt,
					_updatedAt: new Date(),
					urls: [],
					mentions: [],
					channels: [],
					md: [
						{
							type: 'PARAGRAPH',
							value: [{ type: 'PLAIN_TEXT', value: message.msg }],
						},
					],
					...(message.tmid && { tmid: message.tmid }),
					...(message.tmid && message.tshow && { tshow: message.tshow }),
				};

				console.log(`Sending message to room ${message.rid} with original scheduled _id ${message._id}`);
				const result = await sendMessage(user, messageToSend, room);
				console.log(`sendMessage result for scheduled message ${message._id}:`, result);

				await notifyOnMessageChange({ id: result._id });
				await notifyOnRoomChangedById(message.rid);

				await ScheduledMessages.removeAsync({ _id: message._id });
				console.log(`Sent scheduled message ${message._id} (new message _id: ${result._id}) at ${now.toISOString()}`);
			} catch (error) {
				console.error(`Failed to send scheduled message ${message._id}:`, error);
			}
		}
	});
}
