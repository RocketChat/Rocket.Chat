import type { ILivechatUnitMonitor } from '@rocket.chat/core-typings';
import type { ILivechatUnitMonitorsModel } from '@rocket.chat/model-typings';
import { BaseRaw } from '@rocket.chat/models';
import type { Db, FindCursor, UpdateResult, DeleteResult, IndexDescription } from 'mongodb';

export class LivechatUnitMonitorsRaw extends BaseRaw<ILivechatUnitMonitor> implements ILivechatUnitMonitorsModel {
	constructor(db: Db) {
		super(db, 'livechat_unit_monitors');
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{
				key: {
					unitId: 1,
				},
			},
			{
				key: {
					monitorId: 1,
				},
			},
		];
	}

	findByUnitId(unitId: string): FindCursor<ILivechatUnitMonitor> {
		return this.find({ unitId });
	}

	findByMonitorId(monitorId: string): FindCursor<ILivechatUnitMonitor> {
		return this.find({ monitorId });
	}

	saveMonitor(monitor: { monitorId: string; unitId: string; username: string }): Promise<UpdateResult> {
		return this.updateOne(
			{
				monitorId: monitor.monitorId,
				unitId: monitor.unitId,
			},
			{
				$set: {
					monitorId: monitor.monitorId,
					unitId: monitor.unitId,
					username: monitor.username,
				},
			},
			{ upsert: true },
		);
	}

	removeByUnitIdAndMonitorId(unitId: string, monitorId: string): Promise<DeleteResult> {
		return this.deleteMany({ unitId, monitorId });
	}

	removeByUnitId(unitId: string): Promise<DeleteResult> {
		return this.deleteMany({ unitId });
	}

	removeByMonitorId(monitorId: string): Promise<DeleteResult> {
		return this.deleteMany({ monitorId });
	}
}
