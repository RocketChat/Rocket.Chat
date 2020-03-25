import { BaseRaw } from '../../../../../app/models/server/raw/BaseRaw';
import LivechatPriority from '../models/LivechatPriority';

export class LivechatPriorityRaw extends BaseRaw {
}

export default new LivechatPriorityRaw(LivechatPriority.model.rawCollection());
