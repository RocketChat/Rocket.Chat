import { registerModel } from '@rocket.chat/models';
import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { ICannedResponseModel } from '@rocket.chat/model-typings';

import { ModelClass } from '../../../server/models/ModelClass';
import MeteorModel from '../../app/models/server/models/CannedResponse';

export class CannedResponse extends ModelClass<IRocketChatRecord> implements ICannedResponseModel {}

const col = (MeteorModel as any).model.rawCollection();
registerModel('ICannedResponseModel', new CannedResponse(col) as ICannedResponseModel);
