import type { IAnalyticsSeatRequest } from '@rocket.chat/core-typings';
import { Analytics } from '@rocket.chat/models';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IAnalyticsService } from '../../sdk/types/IAnalyticsService';

export class AnalyticsService extends ServiceClassInternal implements IAnalyticsService {
	protected name = 'analytics';

	async saveSeatRequest(): Promise<void> {
		Analytics.update({ type: 'seat-request' }, { $inc: { count: 1 } }, { upsert: true });
	}

	async getSeatRequestCount(): Promise<number> {
		const result = (await Analytics.findOne({ type: 'seat-request' }, {})) as IAnalyticsSeatRequest | null;

		return result?.count ? result.count : 0;
	}

	async resetSeatRequestCount(): Promise<void> {
		await Analytics.update({ type: 'seat-request' }, { $set: { count: 0 } }, { upsert: true });
	}
}
