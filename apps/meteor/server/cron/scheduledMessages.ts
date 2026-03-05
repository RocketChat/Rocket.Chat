import { cronJobs } from '@rocket.chat/cron';
import type { Logger } from '@rocket.chat/logger';
import { ScheduledMessages, Rooms, Users, Messages } from '@rocket.chat/models';
import { Message } from '@rocket.chat/core-services';


export async function processScheduledMessages(logger: Logger): Promise<void> {
	try {
		const now = new Date();
		logger.debug(`Checking for scheduled messages at ${now.toISOString()}`);

		const messagesToSend = await ScheduledMessages.findReadyToSend(now).toArray();

		logger.debug(`Found ${messagesToSend.length} scheduled messages ready to send`);

		if (messagesToSend.length === 0) {
			return;
		}

		logger.info(`Processing ${messagesToSend.length} scheduled messages`);

		for (const scheduledMsg of messagesToSend) {
			try {
				const room = await Rooms.findOneById(scheduledMsg.rid);
				if (!room) {
					await ScheduledMessages.updateStatus(scheduledMsg._id, 'failed', undefined, 'Room not found');
					logger.warn(`Scheduled message ${scheduledMsg._id}: Room ${scheduledMsg.rid} not found`);
					continue;
				}

				const user = await Users.findOneById(scheduledMsg.userId);
				if (!user) {
					await ScheduledMessages.updateStatus(scheduledMsg._id, 'failed', undefined, 'User not found');
					logger.warn(`Scheduled message ${scheduledMsg._id}: User ${scheduledMsg.userId} not found`);
					continue;
				}

				const sentMessage = await Message.sendMessage({
					fromId: scheduledMsg.userId,
					rid: scheduledMsg.rid,
					msg: scheduledMsg.msg,
				});

				const savedMessage = await Messages.findOneById(sentMessage._id);
				if (!savedMessage) {
					throw new Error('Message was not saved to database');
				}

				await ScheduledMessages.updateStatus(scheduledMsg._id, 'sent', new Date());

				logger.info(`Scheduled message ${scheduledMsg._id} sent successfully`);
			} catch (error) {
				logger.error(`Failed to send scheduled message ${scheduledMsg._id}:`, error);

				await ScheduledMessages.updateStatus(
					scheduledMsg._id,
					'failed',
					undefined,
					error instanceof Error ? error.message : String(error),
				);
			}
		}
	} catch (error) {
		logger.error('Error processing scheduled messages:', error);
		if (error instanceof Error) {
			logger.error('Error stack:', error.stack);
		}
	}
}

export async function scheduledMessagesCron(logger: Logger): Promise<void> {
	try {
		logger.info('Starting scheduled messages cron');

		await processScheduledMessages(logger);

		await cronJobs.add('Process scheduled messages', '* * * * *', async () => {
			await processScheduledMessages(logger);
		});

		logger.info('Scheduled messages cron job registered successfully');
	} catch (error) {
		logger.error('Failed to start scheduled messages cron:', error);
		throw error;
	}
}
