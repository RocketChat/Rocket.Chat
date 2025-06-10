import { cronJobs } from '@rocket.chat/cron';

import { settings } from '../../app/settings/server';
import { Users } from '@rocket.chat/models';

export async function passkeyCron(): Promise<void> {
	return cronJobs.add('Passkey', '0 3 * * *', async () => {
		await Users.removeExpiredPasskeys(120); // 删除120天未使用的 passkeys
	});
}
