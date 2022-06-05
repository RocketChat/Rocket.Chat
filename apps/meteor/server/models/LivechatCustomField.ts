import type { ILivechatCustomField } from '@rocket.chat/core-typings';
import type { ILivechatCustomFieldModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/LivechatCustomField';

export class LivechatCustomField extends ModelClass<ILivechatCustomField> implements ILivechatCustomFieldModel {}

const col = MeteorModel.model.rawCollection();
registerModel('ILivechatCustomFieldModel', new LivechatCustomField(col, trashCollection) as ILivechatCustomFieldModel);
