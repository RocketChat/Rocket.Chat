import { registerModel } from '@rocket.chat/models';
import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ILivechatTagModel } from '@rocket.chat/model-typings';

import { BaseRaw } from '../../../server/models/raw/BaseRaw';
import MeteorModel from '../../app/models/server/models/LivechatTag';

export class LivechatTag extends BaseRaw<IRocketChatRecord> implements ILivechatTagModel {}

const col = (MeteorModel as any).model.rawCollection();
registerModel('ILivechatTagModel', new LivechatTag(col) as ILivechatTagModel);
