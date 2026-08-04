import crypto from 'crypto';

import type { APIResponse } from '@playwright/test';
import type { UsersUpdateOwnBasicInfoParamsPOST } from '@rocket.chat/rest-typings';

import type { BaseTest } from './test';

export const updateOwnUserPassword = async (
	api: BaseTest['api'],
	{ newPassword, currentPassword }: { newPassword: string; currentPassword: string },
): Promise<APIResponse> => {
	/**
	 * SHA-256 is used here for client-side password hashing before transmission (2FA verification), not for password storage. The server expects this specific format for password verification. This is a requirement of the Rocket.Chat API for the 2FA flow. */
	const encryptedPassword = crypto.createHash('sha256').update(currentPassword, 'utf8').digest('hex');
	return updateOwnUserInfo(api, { newPassword, currentPassword: encryptedPassword });
};

const updateOwnUserInfo = (api: BaseTest['api'], data: UsersUpdateOwnBasicInfoParamsPOST['data']): Promise<APIResponse> =>
	api.post(`/users.updateOwnBasicInfo`, { data });
