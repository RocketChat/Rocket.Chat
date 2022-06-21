import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { LivechatTriggerRaw } from './raw/LivechatTrigger';

const col = db.collection(`${prefix}livechat_trigger`);
registerModel('ILivechatTriggerModel', new LivechatTriggerRaw(col, trashCollection));
