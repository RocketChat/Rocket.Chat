import { registerModel } from '@rocket.chat/models';

import MeteorModel from '../../app/models/server/models/CannedResponse';
import { CannedResponseRaw } from './raw/CannedResponse';

const col = MeteorModel.model.rawCollection();
registerModel('ICannedResponseModel', new CannedResponseRaw(col));
