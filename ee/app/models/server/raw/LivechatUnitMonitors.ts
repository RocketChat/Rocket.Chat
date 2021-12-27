import { BaseRaw } from '../../../../../app/models/server/raw/BaseRaw';
import LivechatUnitMonitors from '../models/LivechatUnitMonitors';
import { ILivechatUnitMonitor } from '../../../../../definition/ILivechatUnitMonitor';

export class LivechatUnitMonitorsRaw extends BaseRaw<ILivechatUnitMonitor> {
}

// @ts-expect-error
export default new LivechatUnitMonitorsRaw(LivechatUnitMonitors.model.rawCollection());
