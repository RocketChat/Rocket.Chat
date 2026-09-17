import { getUserInfo } from './getUserInfo';
import type { BaseTest } from './test';
import { expect } from './test';

export const expectPollUserStatus = async (api: BaseTest['api'], username: string, status: 'online' | 'offline' | 'away' | 'busy') => {
	await expect.poll(async () => (await getUserInfo(api, username))?.status).toBe(status);
};
