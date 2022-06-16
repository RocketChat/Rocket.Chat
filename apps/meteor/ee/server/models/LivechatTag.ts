import { registerModel } from '@rocket.chat/models';
import type { ILivechatTagModel } from '@rocket.chat/model-typings';

import MeteorModel from '../../app/models/server/models/LivechatTag';
import { LivechatTagRaw } from './raw/LivechatTag';

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatTagModel', new LivechatTagRaw(col) as ILivechatTagModel);
