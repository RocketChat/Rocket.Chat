import type { ILivechatPriority } from '@rocket.chat/core-typings';

import type { BaseTest } from '../test';
import { expect } from '../test';

export const getPriorityByi18nLabel = async (api: BaseTest['api'], i18n: string): Promise<ILivechatPriority> => {
	const allPriorityResp = await api.get('/livechat/priorities');
	expect(allPriorityResp.status()).toBe(200);
	const { priorities } = (await allPriorityResp.json()) as { priorities: ILivechatPriority[] };
	const priority = priorities.find((p) => p.i18n === i18n);
	if (!priority) {
		throw new Error('Could not find priority with i18n "High"');
	}

	return priority;
};
