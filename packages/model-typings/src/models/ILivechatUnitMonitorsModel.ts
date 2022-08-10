import type { ILivechatMonitor } from '@rocket.chat/core-typings';
import type { DeleteResult, FindCursor, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILivechatUnitMonitorsModel extends IBaseModel<ILivechatMonitor> {
	removeByUnitId(unitId: string): Promise<DeleteResult>;
	findByMonitorId(monitorId: string): FindCursor<ILivechatMonitor>;
	findByUnitId(unitId: string): FindCursor<ILivechatMonitor>;
	removeByUnitIdAndMonitorId(unitId: string, monitorId: string): Promise<DeleteResult>;
	saveMonitor(monitor: { monitorId: string; unitId: string; username: string }): Promise<UpdateResult>;
}
