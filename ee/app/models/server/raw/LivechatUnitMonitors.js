import { BaseRaw } from '../../../../../app/models/server/raw/BaseRaw';
import LivechatUnitMonitors from '../models/LivechatUnitMonitors';

export class LivechatUnitMonitorsRaw extends BaseRaw {}

export default new LivechatUnitMonitorsRaw(LivechatUnitMonitors.model.rawCollection());
