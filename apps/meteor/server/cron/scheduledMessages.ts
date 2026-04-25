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
				await Messages.updateOne(
					{ _id: scheduledMessage._id },
					{ $set: { scheduled: true } },
				);
				continue;
			}

			let room;
			try {
				room = await canSendMessageAsync(scheduledMessage.rid, user);
			} catch (error: any) {
				const errorCode = error.error || error.message;
				const isRecoverable = ['room_is_archived', 'room_is_blocked', 'You_have_been_muted', 'error-invalid-room'].includes(errorCode);
				
				if (isRecoverable) {
					const retryCount = ((scheduledMessage as any).scheduledRetryCount || 0) + 1;
					const maxRetries = 5;

					if (retryCount >= maxRetries) {
						SystemLogger.error({
							msg: 'Recoverable error for scheduled message, max retries reached',
							err: error,
							messageId: scheduledMessage._id,
							roomId: scheduledMessage.rid,
							userId: scheduledMessage.u._id,
							retryCount,
						});
						await Messages.deleteOne({ _id: scheduledMessage._id });
					} else {
						const delayMinutes = Math.pow(2, retryCount);
						const newScheduledAt = new Date(new Date().getTime() + delayMinutes * 60 * 1000);

						await Messages.updateOne(
							{ _id: scheduledMessage._id },
							{
								$set: {
									scheduledAt: newScheduledAt,
									scheduledRetryCount: retryCount,
									scheduled: true,
								},
							},
						);
					}
				} else {
					SystemLogger.error({
						msg: 'Non-recoverable error for scheduled message, deleting',
						err: error,
						messageId: scheduledMessage._id,
						roomId: scheduledMessage.rid,
						userId: scheduledMessage.u._id,
					});
					await Messages.deleteOne({ _id: scheduledMessage._id });
				}
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

			try {
				await sendMessage(user, message, room, {});
				await Messages.deleteOne({ _id: scheduledMessage._id });
			} catch (error: any) {
				const retryCount = ((scheduledMessage as any).scheduledRetryCount || 0) + 1;
				const maxRetries = 5;

				if (retryCount >= maxRetries) {
					SystemLogger.error({
						msg: 'Scheduled message failed after max retries',
						err: error,
						messageId: scheduledMessage._id,
						roomId: scheduledMessage.rid,
						userId: scheduledMessage.u._id,
						retryCount,
					});
					await Messages.deleteOne({ _id: scheduledMessage._id });
				} else {
					SystemLogger.error({
						msg: 'Error processing scheduled message',
						err: error,
						messageId: scheduledMessage._id,
						roomId: scheduledMessage.rid,
						userId: scheduledMessage.u._id,
						retryCount,
					});

					const delayMinutes = Math.pow(2, retryCount);
					const newScheduledAt = new Date(new Date().getTime() + delayMinutes * 60 * 1000);

					await Messages.updateOne(
						{ _id: scheduledMessage._id },
						{
							$set: {
								scheduledAt: newScheduledAt,
								scheduledRetryCount: retryCount,
								scheduled: true,
							},
						},
					);
				}
			}
		} catch (error: any) {
			SystemLogger.error({
				msg: 'Unexpected error processing scheduled message',
				err: error,
				messageId: scheduledMessage._id,
				roomId: scheduledMessage.rid,
				userId: scheduledMessage.u._id,
			});
		}
	}
}

export async function scheduledMessagesCron(): Promise<void> {
	return cronJobs.add('Process Scheduled Messages', '* * * * *', async () => processScheduledMessages());
}
