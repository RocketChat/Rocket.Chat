import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { LivechatCustomFieldRaw } from './raw/LivechatCustomField';

registerModel('ILivechatCustomFieldModel', new LivechatCustomFieldRaw(db, trashCollection));
