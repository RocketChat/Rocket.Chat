import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { LivechatBusinessHoursRaw } from './raw/LivechatBusinessHours';

registerModel('ILivechatBusinessHoursModel', new LivechatBusinessHoursRaw(db, trashCollection));
