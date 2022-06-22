import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { LivechatTagRaw } from './raw/LivechatTag';

registerModel('ILivechatTagModel', new LivechatTagRaw(db));
