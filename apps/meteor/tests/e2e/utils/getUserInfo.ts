import { IUser } from '@rocket.chat/core-typings';

import type { BaseTest } from './test';

export const getUserInfo = async (api: BaseTest['api'], username: string): Promise<IUser | undefined> => {
	const response = await api.get(`/users.info?username=${username}`);

	if (response.status() !== 200) {
		throw new Error('Failed to get user info.');
	}

	const data = await response.json();

	return data.user;
}
