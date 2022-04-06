import type { Db } from 'mongodb';
import type { IAnalyticsSeatRequest } from '@rocket.chat/core-typings';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { IAnalyticsService } from '../../sdk/types/IAnalyticsService';
import { AnalyticsRaw } from '../../../app/models/server/raw/Analytics';

export class AnalyticsService extends ServiceClassInternal implements IAnalyticsService {
	protected name = 'analytics';

	private Analytics: AnalyticsRaw;

	constructor(db: Db) {
		super();
		this.Analytics = new AnalyticsRaw(db.collection('rocketchat_analytics'));
	}

	async saveSeatRequest(): Promise<void> {
		this.Analytics.update({ type: 'seat-request' }, { $inc: { count: 1 } }, { upsert: true });
	}

	async getSeatRequestCount(): Promise<number> {
		const result = await this.Analytics.findOne<IAnalyticsSeatRequest>({ type: 'seat-request' }, {});
		return result?.count ? result.count : 0;
	}

	async resetSeatRequestCount(): Promise<void> {
		await this.Analytics.update({ type: 'seat-request' }, { $set: { count: 0 } }, { upsert: true });
	}
}
