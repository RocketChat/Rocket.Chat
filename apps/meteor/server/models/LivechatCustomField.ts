import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { LivechatCustomFieldRaw } from './raw/LivechatCustomField';

registerModel('ILivechatCustomFieldModel', new LivechatCustomFieldRaw(db));
