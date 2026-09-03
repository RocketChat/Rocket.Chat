import { cronJobs } from '@rocket.chat/cron';

import { dispatchScheduledMessages } from '../lib/messages/scheduled/dispatchScheduledMessages';

export async function scheduledMessagesCron(): Promise<void> {
	// one minute is the finest granularity the scheduler offers, and also the delivery precision we promise
	return cronJobs.add('scheduled-messages', '* * * * *', async () => dispatchScheduledMessages());
}
