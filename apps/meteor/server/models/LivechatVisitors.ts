import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { LivechatVisitorsRaw } from './raw/LivechatVisitors';

registerModel('ILivechatVisitorsModel', new LivechatVisitorsRaw(db, trashCollection));
