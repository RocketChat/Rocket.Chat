import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/LivechatCustomField';
import { LivechatCustomFieldRaw } from './raw/LivechatCustomField';

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatCustomFieldModel', new LivechatCustomFieldRaw(col, trashCollection));
