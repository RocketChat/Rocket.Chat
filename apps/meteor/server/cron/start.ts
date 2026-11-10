import { cronJobs } from '@rocket.chat/cron';

import { client } from '../database/utils';

export const startCron = async () => {
	return cronJobs.start(client.db());
};
