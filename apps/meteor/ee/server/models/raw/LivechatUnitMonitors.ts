import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ILivechatUnitMonitorsModel } from '@rocket.chat/model-typings';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class LivechatUnitMonitorsRaw extends BaseRaw<IRocketChatRecord> implements ILivechatUnitMonitorsModel {}
