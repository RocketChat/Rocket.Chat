import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';

import { businessHourManager } from '../../business-hour';

export async function findLivechatBusinessHour(id?: string, type?: string): Promise<Record<string, ILivechatBusinessHour>> {
	return {
		businessHour: (await businessHourManager.getBusinessHour(id, type)) as ILivechatBusinessHour,
	};
}
