import { registerModel } from '@rocket.chat/models';

import MeteorModel from '../../app/models/server/models/LivechatUnit';
import { LivechatUnitRaw } from './raw/LivechatUnit';

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatUnitModel', new LivechatUnitRaw(col));
