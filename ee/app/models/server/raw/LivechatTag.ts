import { BaseRaw } from '../../../../../app/models/server/raw/BaseRaw';
import LivechatTag from '../models/LivechatTag';
import { ILivechatTag } from '../../../../../definition/ILivechatTag';

export class LivechatTagRaw extends BaseRaw<ILivechatTag> {
}

// @ts-expect-error
export default new LivechatTagRaw(LivechatTag.model.rawCollection());
