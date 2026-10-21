import type { APIResponse } from '@playwright/test';
import type { IUser, IUserPhoneNumber } from '@rocket.chat/core-typings';

import type { BaseTest } from './test';

export const setUserPhones = (api: BaseTest['api'], userId: IUser['_id'], phones: IUserPhoneNumber[]): Promise<APIResponse> =>
	api.post('/users.update', { userId, data: { phones } });
