import { registerModel } from '@rocket.chat/models';
import type { ILivechatAgentActivityModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { LivechatAgentActivityRaw } from './raw/LivechatAgentActivity';

const col = db.collection(`${prefix}livechat_agent_activity`);
registerModel('ILivechatAgentActivityModel', new LivechatAgentActivityRaw(col, trashCollection) as ILivechatAgentActivityModel);
