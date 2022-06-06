import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ILivechatTagModel } from '@rocket.chat/model-typings';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class LivechatTagRaw extends BaseRaw<IRocketChatRecord> implements ILivechatTagModel {}
