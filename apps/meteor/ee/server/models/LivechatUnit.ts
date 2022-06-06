import { registerModel } from '@rocket.chat/models';
import type { ILivechatUnitModel } from '@rocket.chat/model-typings';

import { LivechatDepartmentRaw } from '../../../server/models/raw/LivechatDepartment';
import MeteorModel from '../../app/models/server/models/LivechatUnit';

export class LivechatUnit extends LivechatDepartmentRaw implements ILivechatUnitModel {}

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatUnitModel', new LivechatUnit(col) as ILivechatUnitModel);
