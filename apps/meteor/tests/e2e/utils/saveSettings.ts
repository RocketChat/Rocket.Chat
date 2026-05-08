import type { APIResponse } from '@playwright/test';
import type { ISetting } from '@rocket.chat/core-typings';

import type { BaseTest } from './test';

export const saveSettings = (
	api: BaseTest['api'],
	changes: {
		_id: ISetting['_id'];
		value: ISetting['value'];
	}[],
): Promise<APIResponse> =>
	api.post('/method.call/saveSettings', {
		message: JSON.stringify({
			msg: 'method',
			id: '1',
			method: 'saveSettings',
			params: [changes],
		}),
	});
