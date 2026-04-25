import { Messages, Users } from '@rocket.chat/models';
import { cronJobs } from '@rocket.chat/cron';

import { sendMessage } from '../../app/lib/server/functions/sendMessage';
import { canSendMessageAsync } from '../../app/authorization/server/functions/canSendMessage';

export async function processScheduledMessages(): Promise<void> {
	const now = new Date();

	const pendingMessages = await Messages.find({
		scheduled: true,
		scheduledAt: { $lte: now },
	}).toArray();

	for (const scheduledMessage of pendingMessages) {
		let messageDeleted = false;
		try {
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

			await Messages.deleteOne({ _id: scheduledMessage._id });
			messageDeleted = true;

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
		} catch (error: any) {
			if (!messageDeleted) {
				await Messages.deleteOne({ _id: scheduledMessage._id });
			}
		}
	}
}

export async function scheduledMessagesCron(): Promise<void> {
	await processScheduledMessages();

	return cronJobs.add('Process Scheduled Messages', '* * * * *', async () => processScheduledMessages());
}
