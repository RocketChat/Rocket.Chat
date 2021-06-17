import { BaseRaw } from '../../../../../server/models/raw/BaseRaw';
import LivechatTag from '../models/LivechatTag';

export class LivechatTagRaw extends BaseRaw {
}

export default new LivechatTagRaw(LivechatTag.model.rawCollection());
