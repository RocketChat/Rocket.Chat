import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ICannedResponseModel } from '@rocket.chat/model-typings';

import { BaseRaw } from '../../../../server/models/raw/BaseRaw';

export class CannedResponseRaw extends BaseRaw<IRocketChatRecord> implements ICannedResponseModel {}
