import { BaseRaw } from '../../../../../server/models/raw/BaseRaw';
import LivechatUnitMonitors from '../models/LivechatUnitMonitors';

export class LivechatUnitMonitorsRaw extends BaseRaw {
}

export default new LivechatUnitMonitorsRaw(LivechatUnitMonitors.model.rawCollection());
