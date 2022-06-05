import { registerModel } from '@rocket.chat/models';
import type { ILivechatUnitModel } from '@rocket.chat/model-typings';

import { LivechatDepartment } from '../../../server/models/LivechatDepartment';
import MeteorModel from '../../app/models/server/models/LivechatUnit';

export class LivechatUnit extends LivechatDepartment implements ILivechatUnitModel {}

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatUnitModel', new LivechatUnit(col) as ILivechatUnitModel);
