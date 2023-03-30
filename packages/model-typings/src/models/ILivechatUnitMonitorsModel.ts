import type { ILivechatUnitMonitor } from '@rocket.chat/core-typings';
import type { FindCursor, UpdateResult, DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatUnitMonitorsModel extends IBaseModel<ILivechatUnitMonitor> {
	findByUnitId(unitId: string): FindCursor<ILivechatUnitMonitor>;
	findByMonitorId(monitorId: string): FindCursor<ILivechatUnitMonitor>;
	saveMonitor(monitor: { monitorId: string; unitId: string; username: string }): Promise<UpdateResult>;
	removeByUnitIdAndMonitorId(unitId: string, monitorId: string): Promise<DeleteResult>;
	removeByUnitId(unitId: string): Promise<DeleteResult>;
	removeByMonitorId(monitorId: string): Promise<DeleteResult>;
}
