import { registerModel } from '@rocket.chat/models';
import type { ICannedResponseModel } from '@rocket.chat/model-typings';

import MeteorModel from '../../app/models/server/models/CannedResponse';
import { CannedResponseRaw } from './raw/CannedResponse';

const col = (MeteorModel as any).model.rawCollection();
registerModel('ICannedResponseModel', new CannedResponseRaw(col) as ICannedResponseModel);
