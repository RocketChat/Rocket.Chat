import type { ILivechatMonitor } from '@rocket.chat/core-typings';
import type { ILivechatUnitMonitorsModel } from '@rocket.chat/model-typings';
import type { Db, DeleteResult, FindCursor, UpdateResult } from 'mongodb';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

// Fix this to use the right typing
export class LivechatUnitMonitorsRaw extends BaseRaw<ILivechatMonitor> implements ILivechatUnitMonitorsModel {
	constructor(db: Db) {
		super(db, 'livechat_unit_monitors');
	}

	removeByUnitId(unitId: string): Promise<DeleteResult> {
		return this.deleteOne({ unitId });
	}

	findByMonitorId(monitorId: string): FindCursor<ILivechatMonitor> {
		return this.find({ monitorId });
	}

	findByUnitId(unitId: string): FindCursor<ILivechatMonitor> {
		return this.find({ unitId });
	}

	removeByUnitIdAndMonitorId(unitId: string, monitorId: string): Promise<DeleteResult> {
		return this.deleteMany({ unitId, monitorId });
	}

	saveMonitor(monitor: { monitorId: string; unitId: string; username: string }): Promise<UpdateResult> {
		return this.updateOne(
			{
				monitorId: monitor.monitorId,
				unitId: monitor.unitId,
			},
			{
				$set: {
					username: monitor.username,
				},
			},
			{
				upsert: true,
			},
		);
	}
}
