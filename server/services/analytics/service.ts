import { Db } from 'mongodb';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { IAnalyticsService } from '../../sdk/types/IAnalyticsService';
import { AnalyticsRaw } from '../../../app/models/server/raw/Analytics';

export class AnalyticsService extends ServiceClass implements IAnalyticsService {
	protected name = 'analytics';

	private Analytics: AnalyticsRaw

	constructor(db: Db) {
		super();
		this.Analytics = new AnalyticsRaw(db.collection('rocketchat_analytics'));
	}

	async saveSeatRequest(): Promise<void> {
		this.Analytics.update({ type: 'seat-request' }, { $inc: { count: 1 } }, { upsert: true });
	}
}
