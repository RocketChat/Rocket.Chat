import { BaseRaw } from '../../../../../app/models/server/raw/BaseRaw';
import LivechatTag from '../models/LivechatTag';

export class LivechatTagRaw extends BaseRaw {}

export default new LivechatTagRaw(LivechatTag.model.rawCollection());
