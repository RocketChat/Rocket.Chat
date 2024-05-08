import { registerModel } from '@rocket.chat/models';

import { LivechatCustomFieldRaw } from './raw/LivechatCustomField';

registerModel('ILivechatCustomFieldModel', new LivechatCustomFieldRaw());
