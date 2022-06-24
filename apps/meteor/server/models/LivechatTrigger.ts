import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { LivechatTriggerRaw } from './raw/LivechatTrigger';

registerModel('ILivechatTriggerModel', new LivechatTriggerRaw(db, trashCollection));
