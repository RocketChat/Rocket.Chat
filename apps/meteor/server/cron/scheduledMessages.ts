import { Messages, Users } from '@rocket.chat/models';
import { cronJobs } from '@rocket.chat/cron';

import { sendMessage } from '../../app/lib/server/functions/sendMessage';
import { canSendMessageAsync } from '../../app/authorization/server/functions/canSendMessage';
import { SystemLogger } from '../../server/lib/logger/system';

export async function processScheduledMessages(): Promise<void> {
	const now = new Date();

	const pendingMessages = await Messages.find({
		scheduled: true,
		scheduledAt: { $lte: now },
	})
		.limit(100)
		.toArray();

	for (const scheduledMessage of pendingMessages) {
		try {
			const claimResult = await Messages.updateOne(
				{
					_id: scheduledMessage._id,
					scheduled: true,
				},
				{
					$set: { scheduled: false },
				},
			);

			if (claimResult.modifiedCount === 0) {
				continue;
			}

			const user = await Users.findOneById(scheduledMessage.u._id);
			if (!user) {
				await Messages.deleteOne({ _id: scheduledMessage._id });
				continue;
			}

			let room;
			try {
				room = await canSendMessageAsync(scheduledMessage.rid, user);
			} catch (error: any) {
				await Messages.deleteOne({ _id: scheduledMessage._id });
				continue;
			}

			const message: any = {
				msg: scheduledMessage.msg,
				rid: scheduledMessage.rid,
				...(scheduledMessage.tmid && { tmid: scheduledMessage.tmid }),
				...(scheduledMessage.alias && { alias: scheduledMessage.alias }),
				...(scheduledMessage.avatar && { avatar: scheduledMessage.avatar }),
				...(scheduledMessage.emoji && { emoji: scheduledMessage.emoji }),
				...(scheduledMessage.attachments && { attachments: scheduledMessage.attachments }),
			};

			await sendMessage(user, message, room, {});
			await Messages.deleteOne({ _id: scheduledMessage._id });
		} catch (error: any) {
			SystemLogger.error({
				msg: 'Error processing scheduled message',
				err: error,
				messageId: scheduledMessage._id,
				roomId: scheduledMessage.rid,
				userId: scheduledMessage.u._id,
			});

			await Messages.updateOne(
				{ _id: scheduledMessage._id },
				{ $set: { scheduled: true } },
			);
		}
	}
}

export async function scheduledMessagesCron(): Promise<void> {
	await processScheduledMessages();

	return cronJobs.add('Process Scheduled Messages', '* * * * *', async () => processScheduledMessages());
}
